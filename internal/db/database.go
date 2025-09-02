package db

import (
	"fmt"
	"log"
	"os"
	"path/filepath"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// Database encapsulates the database connection
type Database struct {
	*gorm.DB
}

// New creates a new database instance
func New(dbPath string, debug bool) (*Database, error) {
	// Create the database directory if it doesn't exist
	if err := os.MkdirAll(filepath.Dir(dbPath), 0755); err != nil {
		return nil, fmt.Errorf("unable to create database directory: %w", err)
	}

	// Logger configuration
	logLevel := logger.Silent
	if debug {
		logLevel = logger.Info
	}

	// SQLite connection
	db, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{
		Logger: logger.Default.LogMode(logLevel),
	})
	if err != nil {
		return nil, fmt.Errorf("unable to connect to database: %w", err)
	}

	// Automatic migration
	if err := db.AutoMigrate(&FileItem{}); err != nil {
		return nil, fmt.Errorf("migration error: %w", err)
	}

	return &Database{DB: db}, nil
}

// Close closes the database connection
func (d *Database) Close() error {
	sqlDB, err := d.DB.DB()
	if err != nil {
		return err
	}
	return sqlDB.Close()
}

// Repository for FileItem operations
type FileItemRepository struct {
	db *Database
}

// NewFileItemRepository creates a new repository
func NewFileItemRepository(db *Database) *FileItemRepository {
	return &FileItemRepository{db: db}
}

// Create adds a new file
func (r *FileItemRepository) Create(item *FileItem) error {
	return r.db.Create(item).Error
}

// GetByID retrieves a file by its ID
func (r *FileItemRepository) GetByID(id string) (*FileItem, error) {
	var item FileItem
	if err := r.db.First(&item, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &item, nil
}

// GetByPath retrieves a file by its path
func (r *FileItemRepository) GetByPath(path string) (*FileItem, error) {
	var item FileItem
	if err := r.db.First(&item, "abs_path = ?", path).Error; err != nil {
		return nil, err
	}
	return &item, nil
}

// GetByPathIncludingDeleted retrieves a file by its path, including soft-deleted records
func (r *FileItemRepository) GetByPathIncludingDeleted(path string) (*FileItem, error) {
	var item FileItem
	if err := r.db.Unscoped().First(&item, "abs_path = ?", path).Error; err != nil {
		return nil, err
	}
	return &item, nil
}

// GetByHash retrieves a file by its hash
func (r *FileItemRepository) GetByHash(hash string) (*FileItem, error) {
	var item FileItem
	if err := r.db.First(&item, "hash = ?", hash).Error; err != nil {
		return nil, err
	}
	return &item, nil
}

// Update updates a file
func (r *FileItemRepository) Update(item *FileItem) error {
	return r.db.Save(item).Error
}

// UpdateUnscoped updates a file, including soft-deleted records (for resurrection)
func (r *FileItemRepository) UpdateUnscoped(item *FileItem) error {
	return r.db.Unscoped().Save(item).Error
}

// UpdateThumbnailPath updates only the thumbnail path for a file
func (r *FileItemRepository) UpdateThumbnailPath(id string, thumbPath string) error {
	return r.db.Model(&FileItem{}).Where("id = ?", id).Update("thumb_path", thumbPath).Error
}

// Delete removes a file
func (r *FileItemRepository) Delete(id string) error {
	return r.db.Delete(&FileItem{}, "id = ?", id).Error
}

// DeleteByPath removes a file by its path
func (r *FileItemRepository) DeleteByPath(path string) error {
	return r.db.Delete(&FileItem{}, "abs_path = ?", path).Error
}

// CreateBatch creates multiple files in a single transaction
func (r *FileItemRepository) CreateBatch(items []*FileItem) error {
	if len(items) == 0 {
		return nil
	}
	return r.db.CreateInBatches(items, 100).Error // Process in batches of 100
}

// UpdateBatch updates multiple files in a single transaction
func (r *FileItemRepository) UpdateBatch(items []*FileItem) error {
	if len(items) == 0 {
		return nil
	}
	return r.db.Transaction(func(tx *gorm.DB) error {
		for _, item := range items {
			if err := tx.Save(item).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

// GetExistingPaths returns a map of existing paths with their FileItems
func (r *FileItemRepository) GetExistingPaths(paths []string) (map[string]*FileItem, error) {
	if len(paths) == 0 {
		return make(map[string]*FileItem), nil
	}
	
	var items []FileItem
	if err := r.db.Where("abs_path IN ?", paths).Find(&items).Error; err != nil {
		return nil, err
	}
	
	result := make(map[string]*FileItem)
	for i := range items {
		result[items[i].AbsPath] = &items[i]
	}
	
	return result, nil
}

// ListFilters represents filters for the file list
type ListFilters struct {
	Query     string    `json:"query"`
	Extension string    `json:"extension"`
	DateFrom  *string   `json:"date_from"`
	DateTo    *string   `json:"date_to"`
	MinSize   *int64    `json:"min_size"`
	MaxSize   *int64    `json:"max_size"`
	Page      int       `json:"page"`
	PageSize  int       `json:"page_size"`
}

// ListResult represents the result of a paginated list
type ListResult struct {
	Items      []FileItem `json:"items"`
	Total      int64      `json:"total"`
	Page       int        `json:"page"`
	PageSize   int        `json:"page_size"`
	TotalPages int        `json:"total_pages"`
}

// List retrieves a paginated list of files with filters
func (r *FileItemRepository) List(filters ListFilters) (*ListResult, error) {
	query := r.db.Model(&FileItem{})

	// Filters
	if filters.Query != "" {
		query = query.Where("name LIKE ? OR abs_path LIKE ?", "%"+filters.Query+"%", "%"+filters.Query+"%")
	}

	if filters.Extension != "" {
		query = query.Where("ext = ?", filters.Extension)
	}

	if filters.DateFrom != nil {
		query = query.Where("created_at >= ?", *filters.DateFrom)
	}

	if filters.DateTo != nil {
		query = query.Where("created_at <= ?", *filters.DateTo)
	}

	if filters.MinSize != nil {
		query = query.Where("size >= ?", *filters.MinSize)
	}

	if filters.MaxSize != nil {
		query = query.Where("size <= ?", *filters.MaxSize)
	}

	// Count total
	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, err
	}

	// Pagination
	if filters.Page < 1 {
		filters.Page = 1
	}
	if filters.PageSize < 1 {
		filters.PageSize = 50
	}

	offset := (filters.Page - 1) * filters.PageSize
	
	var items []FileItem
	if err := query.Order("created_at DESC").
		Limit(filters.PageSize).
		Offset(offset).
		Find(&items).Error; err != nil {
		return nil, err
	}

	totalPages := int(total) / filters.PageSize
	if int(total)%filters.PageSize > 0 {
		totalPages++
	}

	return &ListResult{
		Items:      items,
		Total:      total,
		Page:       filters.Page,
		PageSize:   filters.PageSize,
		TotalPages: totalPages,
	}, nil
}

// GetGroupedByDate retrieves files grouped by date
func (r *FileItemRepository) GetGroupedByDate(filters ListFilters) (map[string][]FileItem, error) {
	query := r.db.Model(&FileItem{})

	// Apply the same filters as List
	if filters.Query != "" {
		query = query.Where("name LIKE ? OR abs_path LIKE ?", "%"+filters.Query+"%", "%"+filters.Query+"%")
	}

	if filters.Extension != "" {
		query = query.Where("ext = ?", filters.Extension)
	}

	if filters.DateFrom != nil {
		query = query.Where("created_at >= ?", *filters.DateFrom)
	}

	if filters.DateTo != nil {
		query = query.Where("created_at <= ?", *filters.DateTo)
	}

	if filters.MinSize != nil {
		query = query.Where("size >= ?", *filters.MinSize)
	}

	if filters.MaxSize != nil {
		query = query.Where("size <= ?", *filters.MaxSize)
	}

	var items []FileItem
	if err := query.Order("created_at DESC").Find(&items).Error; err != nil {
		return nil, err
	}

	// Group by date (YYYY-MM-DD)
	grouped := make(map[string][]FileItem)
	for _, item := range items {
		dateKey := item.CreatedAt.Format("2006-01-02")
		grouped[dateKey] = append(grouped[dateKey], item)
	}

	return grouped, nil
}

// Reset drops all tables and recreates them (WARNING: destroys all data)
func (db *Database) Reset() error {
	log.Println("⚠️  Resetting database - all data will be lost!")
	
	// Drop all tables
	if err := db.Migrator().DropTable(&FileItem{}); err != nil {
		log.Printf("Warning: Could not drop FileItem table: %v", err)
	}
	
	// Recreate tables with migrations
	if err := db.AutoMigrate(&FileItem{}); err != nil {
		return fmt.Errorf("failed to recreate tables: %w", err)
	}
	
	log.Println("✅ Database reset completed")
	return nil
}

// ResetWithThumbnails resets the database and cleans up thumbnails
func (db *Database) ResetWithThumbnails(thumbsPath string) error {
	log.Println("⚠️  Resetting database and cleaning thumbnails - all data will be lost!")
	
	// First reset the database
	if err := db.Reset(); err != nil {
		return err
	}
	
	// Clean up thumbnails directory
	if thumbsPath != "" {
		log.Printf("Cleaning thumbnails directory: %s", thumbsPath)
		if err := os.RemoveAll(thumbsPath); err != nil {
			log.Printf("Warning: Could not remove thumbnails directory: %v", err)
		} else {
			// Recreate the thumbnails directory
			if err := os.MkdirAll(thumbsPath, 0755); err != nil {
				log.Printf("Warning: Could not recreate thumbnails directory: %v", err)
			}
		}
	}
	
	log.Println("✅ Database and thumbnails reset completed")
	return nil
}
