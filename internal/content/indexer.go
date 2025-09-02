package content

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"sync"
	"time"

	"github.com/fsnotify/fsnotify"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"tokilane/internal/db"
)

// ThumbnailUpdate represents a thumbnail update task
type ThumbnailUpdate struct {
	FileID   string
	Path     string
	MimeType string
}

// Indexer manages the indexing of files
type Indexer struct {
	config          *IndexerConfig
	db              *db.Database
	repo            *db.FileItemRepository
	thumbnailSvc    *ThumbnailService
	watcher         *fsnotify.Watcher
	eventChannel    chan FileEvent
	stopChannel     chan bool
	thumbnailQueue  chan ThumbnailUpdate
	thumbnailWg     sync.WaitGroup
}

// IndexerConfig configuration of the indexer
type IndexerConfig struct {
	RootPath    string
	ThumbsPath  string
	Debug       bool
	ScanDepth   int // Directory scanning depth (0 = unlimited, 1 = root only, 2 = root+1 level, etc.)
	ScanWorkers int // Number of parallel workers for scanning (0 = auto)
}

// FileEvent represents an event on a file
type FileEvent struct {
	Type     string // "added", "updated", "removed"
	FileID   string
	FilePath string
	FileItem *db.FileItem
}

// NewIndexer creates a new indexer
func NewIndexer(config *IndexerConfig, database *db.Database) (*Indexer, error) {
	repo := db.NewFileItemRepository(database)
	thumbnailSvc := NewThumbnailService(config.ThumbsPath)

	// Create the watcher
	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		return nil, fmt.Errorf("impossible to create the watcher: %w", err)
	}

	indexer := &Indexer{
		config:         config,
		db:             database,
		repo:           repo,
		thumbnailSvc:   thumbnailSvc,
		watcher:        watcher,
		eventChannel:   make(chan FileEvent, 100),
		stopChannel:    make(chan bool),
		thumbnailQueue: make(chan ThumbnailUpdate, 1000), // Buffer for thumbnail tasks
	}

	// Start thumbnail worker
	go indexer.thumbnailWorker()

	return indexer, nil
}

// Start starts the indexer
func (i *Indexer) Start() error {
	log.Printf("Starting indexer for the folder: %s", i.config.RootPath)

	// Initial scan
	if err := i.ScanAll(); err != nil {
		return fmt.Errorf("error during initial scan: %w", err)
	}

	// Start the watcher
	go i.watchFiles()

	// Add the root folder to the watcher
	if err := i.addWatchRecursive(i.config.RootPath); err != nil {
		return fmt.Errorf("error adding the watcher: %w", err)
	}

	log.Println("Indexer started successfully")
	return nil
}

// Stop stops the indexer
func (i *Indexer) Stop() error {
	log.Println("Stopping indexer...")
	
	close(i.stopChannel)
	
	// Wait for all thumbnail processing to complete
	log.Println("Waiting for thumbnail processing to complete...")
	i.thumbnailWg.Wait()
	close(i.thumbnailQueue)
	
	if i.watcher != nil {
		if err := i.watcher.Close(); err != nil {
			return err
		}
	}
	
	close(i.eventChannel)
	log.Println("Indexer stopped")
	return nil
}

// ScanAll scans all files in the root folder with high performance
func (i *Indexer) ScanAll() error {
	log.Println("Starting high-performance scan...")
	
	startTime := time.Now()
	
	// Collect all file paths first (fast)
	var filePaths []string
	err := i.walkWithDepth(i.config.RootPath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			log.Printf("Error scanning %s: %v", path, err)
			return nil
		}

		if info.IsDir() {
			if ShouldSkipDirectory(info.Name()) {
				if i.config.Debug {
					log.Printf("Directory ignored: %s", path)
				}
				return filepath.SkipDir
			}
			return nil
		}

		if IsHiddenFile(info.Name()) {
			return nil
		}

		if i.config.Debug {
			log.Printf("File found for indexing: %s", path)
		}
		filePaths = append(filePaths, path)
		return nil
	})

	if err != nil {
		return err
	}

	log.Printf("Found %d files to process", len(filePaths))

	// Get existing files from database in batch
	existingFiles, err := i.repo.GetExistingPaths(filePaths)
	if err != nil {
		return fmt.Errorf("error getting existing files: %w", err)
	}

	// Process files in chunks to avoid memory issues with very large directories
	const chunkSize = 1000
	totalProcessed := 0
	
	for start := 0; start < len(filePaths); start += chunkSize {
		end := start + chunkSize
		if end > len(filePaths) {
			end = len(filePaths)
		}
		
		chunk := filePaths[start:end]
		chunkExisting := make(map[string]*db.FileItem)
		for _, path := range chunk {
			if existing, ok := existingFiles[path]; ok {
				chunkExisting[path] = existing
			}
		}
		
		processed, err := i.processFilesParallel(chunk, chunkExisting)
		if err != nil {
			return err
		}
		totalProcessed += processed
		
		if i.config.Debug {
			log.Printf("Processed chunk %d-%d (%d files)", start+1, end, processed)
		}
	}
	
	fileCount := totalProcessed

	duration := time.Since(startTime)
	log.Printf("High-performance scan completed: %d files processed in %v", fileCount, duration)
	
	// Clean up files that don't match current depth settings
	go i.cleanupFilesOutsideDepth()
	
	// Clean up orphaned thumbnails
	go i.cleanupOrphanedThumbnails()

	return nil
}

// processFilesParallel processes files in parallel using worker goroutines
func (i *Indexer) processFilesParallel(filePaths []string, existingFiles map[string]*db.FileItem) (int, error) {
	numWorkers := i.config.ScanWorkers
	if numWorkers == 0 {
		numWorkers = runtime.NumCPU()
		if numWorkers > 8 {
			numWorkers = 8 // Limit to 8 workers to avoid overwhelming the system
		}
	}
	
	// Channels for work distribution
	fileChan := make(chan string, 100)
	resultChan := make(chan *db.FileItem, 100)
	errorChan := make(chan error, numWorkers)
	
	// Start workers
	var wg sync.WaitGroup
	for w := 0; w < numWorkers; w++ {
		wg.Add(1)
		go i.fileWorker(fileChan, resultChan, errorChan, existingFiles, &wg)
	}
	
	// Start result collector
	var collectorWg sync.WaitGroup
	collectorWg.Add(1)
	go i.resultCollector(resultChan, &collectorWg)
	
	// Send work
	go func() {
		defer close(fileChan)
		for _, path := range filePaths {
			fileChan <- path
		}
	}()
	
	// Wait for workers to finish
	wg.Wait()
	close(resultChan)
	close(errorChan)
	
	// Wait for collector to finish
	collectorWg.Wait()
	
	// Check for errors
	select {
	case err := <-errorChan:
		return 0, err
	default:
	}
	
	return len(filePaths), nil
}

// fileWorker processes individual files
func (i *Indexer) fileWorker(fileChan <-chan string, resultChan chan<- *db.FileItem, errorChan chan<- error, existingFiles map[string]*db.FileItem, wg *sync.WaitGroup) {
	defer wg.Done()
	
	for path := range fileChan {
		fileItem, err := i.processFile(path, existingFiles[path])
		if err != nil {
			log.Printf("Error processing %s: %v", path, err)
			continue
		}
		
		if fileItem != nil {
			resultChan <- fileItem
		}
	}
}

// resultCollector collects results and saves them in batches
func (i *Indexer) resultCollector(resultChan <-chan *db.FileItem, wg *sync.WaitGroup) {
	defer wg.Done()
	
	const batchSize = 50
	var newItems []*db.FileItem
	var updatedItems []*db.FileItem
	
	saveBatch := func() {
		if len(newItems) > 0 {
			if err := i.repo.CreateBatch(newItems); err != nil {
				log.Printf("Error saving new items batch: %v", err)
			} else {
				for _, item := range newItems {
					// Generate thumbnail asynchronously after DB save
					go i.generateThumbnailAsync(item.ID, item.AbsPath, item.Mime)
					
					i.emitEvent(FileEvent{
						Type:     "added",
						FileID:   item.ID,
						FilePath: item.AbsPath,
						FileItem: item,
					})
				}
			}
			newItems = newItems[:0] // Reset slice
		}
		
		if len(updatedItems) > 0 {
			if err := i.repo.UpdateBatch(updatedItems); err != nil {
				log.Printf("Error updating items batch: %v", err)
			} else {
				for _, item := range updatedItems {
					// Generate thumbnail asynchronously after DB save
					go i.generateThumbnailAsync(item.ID, item.AbsPath, item.Mime)
					
					i.emitEvent(FileEvent{
						Type:     "updated",
						FileID:   item.ID,
						FilePath: item.AbsPath,
						FileItem: item,
					})
				}
			}
			updatedItems = updatedItems[:0] // Reset slice
		}
	}
	
	for fileItem := range resultChan {
		if fileItem.ID == "" {
			// New item (ID will be generated)
			fileItem.ID = uuid.New().String()
			newItems = append(newItems, fileItem)
		} else {
			// Updated item
			updatedItems = append(updatedItems, fileItem)
		}
		
		if len(newItems)+len(updatedItems) >= batchSize {
			saveBatch()
		}
	}
	
	// Save remaining items
	saveBatch()
}

// processFile processes a single file (fast, no I/O blocking)
func (i *Indexer) processFile(path string, existing *db.FileItem) (*db.FileItem, error) {
	stat, err := os.Stat(path)
	if err != nil {
		return nil, err
	}

	// Skip directories - they should not be indexed as files
	if stat.IsDir() {
		return nil, nil
	}

	// Calculate hash (optimized)
	hash, err := ComputeHash(path)
	if err != nil {
		return nil, fmt.Errorf("error calculating hash: %w", err)
	}

	// If file exists and hasn't changed, skip
	if existing != nil && existing.Hash == hash {
		return nil, nil // No change
	}

	// Detect creation date
	createdAt, err := DetectCreatedAt(path)
	if err != nil {
		log.Printf("Error detecting creation date for %s: %v", path, err)
		createdAt = stat.ModTime()
	}

	var fileItem *db.FileItem
	if existing != nil {
		// Update existing
		fileItem = existing
		fileItem.Size = stat.Size()
		fileItem.Hash = hash
		fileItem.CreatedAt = createdAt
		fileItem.Mime = DetectMime(path)
	} else {
		// Create new
		fileItem = &db.FileItem{
			// ID will be set by collector
			AbsPath:   path,
			Name:      stat.Name(),
			Ext:       GetFileExtension(stat.Name()),
			Mime:      DetectMime(path),
			Size:      stat.Size(),
			CreatedAt: createdAt,
			Hash:      hash,
		}
	}

	// Note: Thumbnail generation will be handled after DB save
	return fileItem, nil
}

// thumbnailWorker processes thumbnail updates sequentially to avoid database locks
func (i *Indexer) thumbnailWorker() {
	for update := range i.thumbnailQueue {
		if thumbPath, err := i.thumbnailSvc.GenerateIfNeeded(update.FileID, update.Path, update.MimeType); err != nil {
			log.Printf("Error generating thumbnail for %s: %v", update.Path, err)
		} else if thumbPath != "" {
			// Update thumbnail path in database (with retry mechanism)
			if err := i.repo.UpdateThumbnailPath(update.FileID, thumbPath); err != nil {
				log.Printf("Error updating thumbnail path for %s: %v", update.Path, err)
			}
		}
		i.thumbnailWg.Done()
	}
}

// generateThumbnailAsync queues thumbnail generation to avoid concurrent database access
func (i *Indexer) generateThumbnailAsync(fileID, path, mime string) {
	i.thumbnailWg.Add(1)
	select {
	case i.thumbnailQueue <- ThumbnailUpdate{
		FileID:   fileID,
		Path:     path,
		MimeType: mime,
	}:
		// Successfully queued
	default:
		// Queue is full, skip this thumbnail generation
		log.Printf("Thumbnail queue full, skipping %s", path)
		i.thumbnailWg.Done()
	}
}

// indexFile indexes a unique file
func (i *Indexer) indexFile(path string) error {
	// Check if the file exists in the database (including soft-deleted records)
	existing, err := i.repo.GetByPathIncludingDeleted(path)
	if err != nil && err != gorm.ErrRecordNotFound {
		return err
	}

	// Get the file information
	stat, err := os.Stat(path)
	if err != nil {
		return err
	}

	// Skip directories - they should not be indexed as files
	if stat.IsDir() {
		return nil
	}

	// Calculate the hash
	hash, err := ComputeHash(path)
	if err != nil {
		return fmt.Errorf("error calculating hash: %w", err)
	}

	// If the file exists and hasn't changed, skip (but only if not deleted)
	if existing != nil && !existing.DeletedAt.Valid && existing.Hash == hash {
		return nil
	}

	// Detect the creation date
	createdAt, err := DetectCreatedAt(path)
	if err != nil {
		log.Printf("Error detecting creation date for %s: %v", path, err)
		createdAt = stat.ModTime()
	}

	// Create or update the item
	var fileItem *db.FileItem
	
	if existing != nil {
		// Update the item (or resurrect if it was deleted)
		fileItem = existing
		fileItem.Size = stat.Size()
		fileItem.Hash = hash
		fileItem.CreatedAt = createdAt
		fileItem.Mime = DetectMime(path)
		// Clear the DeletedAt field to resurrect the file
		fileItem.DeletedAt = gorm.DeletedAt{}
	} else {
		// Create a new item
		fileItem = &db.FileItem{
			ID:        uuid.New().String(),
			AbsPath:   path,
			Name:      stat.Name(),
			Ext:       GetFileExtension(stat.Name()),
			Mime:      DetectMime(path),
			Size:      stat.Size(),
			CreatedAt: createdAt,
			Hash:      hash,
		}
	}

	// Generate a thumbnail if needed
	if thumbPath, err := i.thumbnailSvc.GenerateIfNeeded(fileItem.ID, path, fileItem.Mime); err != nil {
		log.Printf("Error generating thumbnail for %s: %v", path, err)
	} else if thumbPath != "" {
		fileItem.ThumbPath = &thumbPath
	}

	// Save to database
	if existing != nil {
		// Use UpdateUnscoped if the file was previously deleted (resurrection)
		if existing.DeletedAt.Valid {
			err = i.repo.UpdateUnscoped(fileItem)
		} else {
			err = i.repo.Update(fileItem)
		}
	} else {
		err = i.repo.Create(fileItem)
	}

	if err != nil {
		return fmt.Errorf("error saving: %w", err)
	}

	// Emit an event
	eventType := "added"
	if existing != nil {
		if existing.DeletedAt.Valid {
			eventType = "added" // Treat resurrection as addition
		} else {
			eventType = "updated"
		}
	}

	i.emitEvent(FileEvent{
		Type:     eventType,
		FileID:   fileItem.ID,
		FilePath: path,
		FileItem: fileItem,
	})

	if i.config.Debug {
		log.Printf("File %s: %s", eventType, path)
	}

	return nil
}

// watchFiles watches for file changes
func (i *Indexer) watchFiles() {
	for {
		select {
		case event, ok := <-i.watcher.Events:
			if !ok {
				return
			}

			if i.config.Debug {
				log.Printf("fsnotify event: %s %s", event.Op, event.Name)
			}

			i.handleFileSystemEvent(event)

		case err, ok := <-i.watcher.Errors:
			if !ok {
				return
			}
			log.Printf("Watcher error: %v", err)

		case <-i.stopChannel:
			return
		}
	}
}

// handleFileSystemEvent handles a file system event
func (i *Indexer) handleFileSystemEvent(event fsnotify.Event) {
	// Ignore temporary and hidden directories
	if ShouldSkipDirectory(filepath.Base(event.Name)) || IsHiddenFile(filepath.Base(event.Name)) {
		return
	}

	switch {
	case event.Op&fsnotify.Create == fsnotify.Create:
		i.handleCreate(event.Name)
	case event.Op&fsnotify.Write == fsnotify.Write:
		i.handleWrite(event.Name)
	case event.Op&fsnotify.Remove == fsnotify.Remove:
		i.handleRemove(event.Name)
	case event.Op&fsnotify.Rename == fsnotify.Rename:
		i.handleRemove(event.Name)
	}
}

// handleCreate handles the creation of a file/directory
func (i *Indexer) handleCreate(path string) {
	stat, err := os.Stat(path)
	if err != nil {
		return
	}

	if stat.IsDir() {
		// New directory: add it to the watcher
		if err := i.watcher.Add(path); err != nil {
			log.Printf("Error adding watcher for %s: %v", path, err)
		}
		return
	}

	// Index the file
	if err := i.indexFile(path); err != nil {
		log.Printf("Error indexing %s: %v", path, err)
	}
}

// handleWrite handles the modification of a file
func (i *Indexer) handleWrite(path string) {
	// Check if it's a file
	stat, err := os.Stat(path)
	if err != nil || stat.IsDir() {
		return
	}

	// Reindex the file
	if err := i.indexFile(path); err != nil {
		log.Printf("Error reindexing %s: %v", path, err)
	}
}

// handleRemove handles the deletion of a file
func (i *Indexer) handleRemove(path string) {
	// Try to retrieve the file from the database
	existing, err := i.repo.GetByPath(path)
	if err != nil {
		return // File not in database
	}

	// Delete the thumbnail
	if err := i.thumbnailSvc.DeleteThumbnail(existing.ID); err != nil {
		log.Printf("Error deleting thumbnail for %s: %v", path, err)
	}

	// Delete from the database
	if err := i.repo.DeleteByPath(path); err != nil {
		log.Printf("Error deleting %s: %v", path, err)
		return
	}

	// Emit an event
	i.emitEvent(FileEvent{
		Type:     "removed",
		FileID:   existing.ID,
		FilePath: path,
		FileItem: existing,
	})

	if i.config.Debug {
		log.Printf("File removed: %s", path)
	}
}

// addWatchRecursive adds recursive watchers
func (i *Indexer) addWatchRecursive(root string) error {
	return i.walkWithDepth(root, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return nil
		}

		if info.IsDir() && !ShouldSkipDirectory(info.Name()) {
			if err := i.watcher.Add(path); err != nil {
				log.Printf("Error adding watcher for %s: %v", path, err)
			}
		}

		return nil
	})
}

// walkWithDepth walks the file tree with depth control
func (i *Indexer) walkWithDepth(root string, walkFn filepath.WalkFunc) error {
	if i.config.ScanDepth == 0 {
		// Unlimited depth - use standard filepath.Walk
		return filepath.Walk(root, walkFn)
	}
	
	// Walk with depth limit (1 = root only, 2 = root+1 level, etc.)
	// Convert to internal depth: ScanDepth 1 -> maxDepth 0, ScanDepth 2 -> maxDepth 1, etc.
	maxDepth := i.config.ScanDepth - 1
	return i.walkWithDepthLimit(root, root, 0, maxDepth, walkFn)
}

// walkWithDepthLimit walks the file tree with a depth limit
func (i *Indexer) walkWithDepthLimit(root, path string, currentDepth, maxDepth int, walkFn filepath.WalkFunc) error {
	info, err := os.Stat(path)
	if err != nil {
		return walkFn(path, nil, err)
	}
	
		if i.config.Debug {
		log.Printf("walkWithDepthLimit: path=%s, currentDepth=%d, maxDepth=%d, isDir=%v",
			path, currentDepth, maxDepth, info.IsDir())
	}
	
	err = walkFn(path, info, nil)
	if err != nil {
		if err == filepath.SkipDir && info.IsDir() {
			return nil
		}
		return err
	}
	
	// If it's not a directory, we're done
	if !info.IsDir() {
		return nil
	}
	
	// If we've exceeded the maximum depth, don't go deeper
	if currentDepth > maxDepth {
		if i.config.Debug {
			log.Printf("walkWithDepthLimit: stopping at depth %d (max: %d) for path: %s", 
				currentDepth, maxDepth, path)
		}
		return nil
	}
	
	entries, err := os.ReadDir(path)
	if err != nil {
		return walkFn(path, info, err)
	}
	
	for _, entry := range entries {
		childPath := filepath.Join(path, entry.Name())
		if err := i.walkWithDepthLimit(root, childPath, currentDepth+1, maxDepth, walkFn); err != nil {
			return err
		}
	}
	
	return nil
}

// emitEvent emits an event
func (i *Indexer) emitEvent(event FileEvent) {
	select {
	case i.eventChannel <- event:
	default:
		log.Printf("Event channel full, event ignored: %s %s", event.Type, event.FilePath)
	}
}

// GetEventChannel returns the event channel
func (i *Indexer) GetEventChannel() <-chan FileEvent {
	return i.eventChannel
}

// cleanupOrphanedThumbnails cleans up orphaned thumbnails
func (i *Indexer) cleanupOrphanedThumbnails() {
	log.Println("Cleaning up orphaned thumbnails...")

	// Retrieve all file IDs
	var fileItems []db.FileItem
	if err := i.db.Find(&fileItems).Error; err != nil {
		log.Printf("Error retrieving files: %v", err)
		return
	}

	var fileIDs []string
	for _, item := range fileItems {
		fileIDs = append(fileIDs, item.ID)
	}

	// Clean up orphaned thumbnails	
	if err := i.thumbnailSvc.CleanupOrphanedThumbnails(fileIDs); err != nil {
		log.Printf("Error cleaning up thumbnails: %v", err)
	} else {
		log.Println("Cleanup of thumbnails completed")
	}
}

// cleanupFilesOutsideDepth removes files that don't match current depth settings
func (i *Indexer) cleanupFilesOutsideDepth() {
	if i.config.ScanDepth == -1 {
		// No depth limit, nothing to clean up
		return
	}
	
	log.Printf("Cleaning up files outside depth limit (%d)...", i.config.ScanDepth)

	// Get all files from database
	var allFiles []db.FileItem
	if err := i.db.Find(&allFiles).Error; err != nil {
		log.Printf("Error retrieving files for depth cleanup: %v", err)
		return
	}

	var filesToRemove []string
	for _, file := range allFiles {
		if !i.isPathWithinDepth(file.AbsPath) {
			filesToRemove = append(filesToRemove, file.AbsPath)
		}
	}

	if len(filesToRemove) == 0 {
		log.Println("No files to remove based on depth settings")
		return
	}

	log.Printf("Removing %d files that are outside depth limit", len(filesToRemove))
	for _, path := range filesToRemove {
		// Use the same logic as handleRemove
		existing, err := i.repo.GetByPath(path)
		if err != nil {
			continue
		}

		// Delete the thumbnail
		if err := i.thumbnailSvc.DeleteThumbnail(existing.ID); err != nil {
			log.Printf("Error deleting thumbnail for %s: %v", path, err)
		}

		// Delete from the database
		if err := i.repo.DeleteByPath(path); err != nil {
			log.Printf("Error deleting %s: %v", path, err)
			continue
		}

		// Emit an event
		i.emitEvent(FileEvent{
			Type:     "removed",
			FileID:   existing.ID,
			FilePath: path,
			FileItem: existing,
		})

		if i.config.Debug {
			log.Printf("File removed (outside depth): %s", path)
		}
	}

	log.Printf("Depth cleanup completed: %d files removed", len(filesToRemove))
}

// isPathWithinDepth checks if a file path is within the configured scan depth
func (i *Indexer) isPathWithinDepth(filePath string) bool {
	if i.config.ScanDepth == 0 {
		return true // No depth limit
	}

	// Calculate relative path from root
	relPath, err := filepath.Rel(i.config.RootPath, filePath)
	if err != nil {
		return false // If we can't calculate relative path, consider it outside
	}

	// If file is directly in root directory
	if relPath == filepath.Base(filePath) {
		return i.config.ScanDepth >= 1 // Depth 1 allows root files
	}

	// Count directory separators to determine depth
	pathParts := strings.Split(filepath.Dir(relPath), string(filepath.Separator))
	depth := 0
	
	// Remove empty parts and count actual directories
	for _, part := range pathParts {
		if part != "" && part != "." {
			depth++
		}
	}

	// Convert internal depth to ScanDepth: depth 0 -> ScanDepth 1, depth 1 -> ScanDepth 2, etc.
	requiredScanDepth := depth + 1

	if i.config.Debug {
		log.Printf("isPathWithinDepth: file=%s, relPath=%s, depth=%d, requiredScanDepth=%d, configScanDepth=%d, allowed=%v", 
			filePath, relPath, depth, requiredScanDepth, i.config.ScanDepth, requiredScanDepth <= i.config.ScanDepth)
	}

	return requiredScanDepth <= i.config.ScanDepth
}
