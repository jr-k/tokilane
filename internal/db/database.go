package db

import (
	"fmt"
	"os"
	"path/filepath"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// Database encapsule la connexion à la base de données
type Database struct {
	*gorm.DB
}

// New crée une nouvelle instance de base de données
func New(dbPath string, debug bool) (*Database, error) {
	// Créer le dossier de la base de données s'il n'existe pas
	if err := os.MkdirAll(filepath.Dir(dbPath), 0755); err != nil {
		return nil, fmt.Errorf("impossible de créer le dossier de la base de données: %w", err)
	}

	// Configuration du logger
	logLevel := logger.Silent
	if debug {
		logLevel = logger.Info
	}

	// Connexion à SQLite
	db, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{
		Logger: logger.Default.LogMode(logLevel),
	})
	if err != nil {
		return nil, fmt.Errorf("impossible de se connecter à la base de données: %w", err)
	}

	// Migration automatique
	if err := db.AutoMigrate(&FileItem{}); err != nil {
		return nil, fmt.Errorf("erreur lors de la migration: %w", err)
	}

	return &Database{DB: db}, nil
}

// Close ferme la connexion à la base de données
func (d *Database) Close() error {
	sqlDB, err := d.DB.DB()
	if err != nil {
		return err
	}
	return sqlDB.Close()
}

// Repository pour les opérations sur FileItem
type FileItemRepository struct {
	db *Database
}

// NewFileItemRepository crée un nouveau repository
func NewFileItemRepository(db *Database) *FileItemRepository {
	return &FileItemRepository{db: db}
}

// Create ajoute un nouveau fichier
func (r *FileItemRepository) Create(item *FileItem) error {
	return r.db.Create(item).Error
}

// GetByID récupère un fichier par son ID
func (r *FileItemRepository) GetByID(id string) (*FileItem, error) {
	var item FileItem
	if err := r.db.First(&item, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &item, nil
}

// GetByPath récupère un fichier par son chemin
func (r *FileItemRepository) GetByPath(path string) (*FileItem, error) {
	var item FileItem
	if err := r.db.First(&item, "abs_path = ?", path).Error; err != nil {
		return nil, err
	}
	return &item, nil
}

// GetByHash récupère un fichier par son hash
func (r *FileItemRepository) GetByHash(hash string) (*FileItem, error) {
	var item FileItem
	if err := r.db.First(&item, "hash = ?", hash).Error; err != nil {
		return nil, err
	}
	return &item, nil
}

// Update met à jour un fichier
func (r *FileItemRepository) Update(item *FileItem) error {
	return r.db.Save(item).Error
}

// Delete supprime un fichier
func (r *FileItemRepository) Delete(id string) error {
	return r.db.Delete(&FileItem{}, "id = ?", id).Error
}

// DeleteByPath supprime un fichier par son chemin
func (r *FileItemRepository) DeleteByPath(path string) error {
	return r.db.Delete(&FileItem{}, "abs_path = ?", path).Error
}

// ListFilters représente les filtres pour la liste des fichiers
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

// ListResult représente le résultat d'une liste paginée
type ListResult struct {
	Items      []FileItem `json:"items"`
	Total      int64      `json:"total"`
	Page       int        `json:"page"`
	PageSize   int        `json:"page_size"`
	TotalPages int        `json:"total_pages"`
}

// List récupère une liste paginée de fichiers avec filtres
func (r *FileItemRepository) List(filters ListFilters) (*ListResult, error) {
	query := r.db.Model(&FileItem{})

	// Filtres
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

	// Compter le total
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

// GetGroupedByDate récupère les fichiers groupés par date
func (r *FileItemRepository) GetGroupedByDate(filters ListFilters) (map[string][]FileItem, error) {
	query := r.db.Model(&FileItem{})

	// Appliquer les mêmes filtres que List
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

	// Grouper par date (YYYY-MM-DD)
	grouped := make(map[string][]FileItem)
	for _, item := range items {
		dateKey := item.CreatedAt.Format("2006-01-02")
		grouped[dateKey] = append(grouped[dateKey], item)
	}

	return grouped, nil
}
