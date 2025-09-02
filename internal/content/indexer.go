package content

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"time"

	"github.com/fsnotify/fsnotify"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"tokilane/internal/db"
)

// Indexer manages the indexing of files
type Indexer struct {
	config          *IndexerConfig
	db              *db.Database
	repo            *db.FileItemRepository
	thumbnailSvc    *ThumbnailService
	watcher         *fsnotify.Watcher
	eventChannel    chan FileEvent
	stopChannel     chan bool
}

// IndexerConfig configuration of the indexer
type IndexerConfig struct {
	RootPath    string
	ThumbsPath  string
	Debug       bool
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

	return &Indexer{
		config:       config,
		db:           database,
		repo:         repo,
		thumbnailSvc: thumbnailSvc,
		watcher:      watcher,
		eventChannel: make(chan FileEvent, 100),
		stopChannel:  make(chan bool),
	}, nil
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
	
	if i.watcher != nil {
		if err := i.watcher.Close(); err != nil {
			return err
		}
	}
	
	close(i.eventChannel)
	log.Println("Indexer stopped")
	return nil
}

// ScanAll scans all files in the root folder
func (i *Indexer) ScanAll() error {
	log.Println("Starting full scan...")
	
	start := time.Now()
	fileCount := 0

	err := filepath.Walk(i.config.RootPath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			log.Printf("Error scanning %s: %v", path, err)
			return nil // Continue despite the error
		}

		// Ignore directories
		if info.IsDir() {
			if ShouldSkipDirectory(info.Name()) {
				if i.config.Debug {
					log.Printf("Directory ignored: %s", path)
				}
				return filepath.SkipDir
			}
			return nil
		}

		// Ignore hidden files
		if IsHiddenFile(info.Name()) {
			return nil
		}

		// Index the file
		if err := i.indexFile(path); err != nil {
			log.Printf("Error indexing %s: %v", path, err)
		} else {
			fileCount++
		}

		return nil
	})

	if err != nil {
		return err
	}

	duration := time.Since(start)
	log.Printf("Scan completed: %d files indexed in %v", fileCount, duration)
	
	// Clean up orphaned thumbnails
	go i.cleanupOrphanedThumbnails()

	return nil
}

// indexFile indexes a unique file
func (i *Indexer) indexFile(path string) error {
	// Check if the file exists in the database
	existing, err := i.repo.GetByPath(path)
	if err != nil && err != gorm.ErrRecordNotFound {
		return err
	}

	// Get the file information
	stat, err := os.Stat(path)
	if err != nil {
		return err
	}

	// Calculate the hash
	hash, err := ComputeHash(path)
	if err != nil {
		return fmt.Errorf("error calculating hash: %w", err)
	}

	// If the file exists and hasn't changed, skip
	if existing != nil && existing.Hash == hash {
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
		// Update the item
		fileItem = existing
		fileItem.Size = stat.Size()
		fileItem.Hash = hash
		fileItem.CreatedAt = createdAt
		fileItem.Mime = DetectMime(path)
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
		err = i.repo.Update(fileItem)
	} else {
		err = i.repo.Create(fileItem)
	}

	if err != nil {
		return fmt.Errorf("error saving: %w", err)
	}

	// Emit an event
	eventType := "added"
	if existing != nil {
		eventType = "updated"
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
	return filepath.Walk(root, func(path string, info os.FileInfo, err error) error {
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
