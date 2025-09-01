package db

import (
	"fmt"
	"time"

	"gorm.io/gorm"
)

// FileItem represents an indexed file in the database
type FileItem struct {
	ID        string    `gorm:"primaryKey" json:"id"`                    // UUID
	AbsPath   string    `gorm:"uniqueIndex;not null" json:"abs_path"`    // Absolute path
	Name      string    `gorm:"not null" json:"name"`                    // File name
	Ext       string    `gorm:"index" json:"ext"`                        // Extension
	Mime      string    `json:"mime"`                                    // Type MIME
	Size      int64     `json:"size"`                                    // Size in bytes
	CreatedAt time.Time `gorm:"index" json:"created_at"`                 // File creation date
	Hash      string    `gorm:"index" json:"hash"`                       // SHA256 for deduplication
	ThumbPath *string   `json:"thumb_path,omitempty"`                    // Thumbnail path (if image)
	AddedAt   time.Time `gorm:"autoCreateTime" json:"added_at"`          // Indexing date
	UpdatedAt time.Time `gorm:"autoUpdateTime" json:"updated_at"`        // Last update
	DeletedAt gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`  // Soft delete
}

// TableName specifies the table name
func (FileItem) TableName() string {
	return "file_items"
}

// IsPreviewable determines if the file can be previewed
func (f *FileItem) IsPreviewable() bool {
	switch f.Mime {
	case "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml":
		return true
	case "application/pdf":
		return true
	case "text/plain", "text/markdown":
		return true
	default:
		return false
	}
}

// HasThumbnail checks if the file has a thumbnail
func (f *FileItem) HasThumbnail() bool {
	return f.ThumbPath != nil && *f.ThumbPath != ""
}

// IsImage checks if the file is an image
func (f *FileItem) IsImage() bool {
	switch f.Mime {
	case "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml":
		return true
	default:
		return false
	}
}

// FormatSize returns the formatted size for display
func (f *FileItem) FormatSize() string {
	const unit = 1024
	if f.Size < unit {
		return fmt.Sprintf("%d B", f.Size)
	}
	div, exp := int64(unit), 0
	for n := f.Size / unit; n >= unit; n /= unit {
		div *= unit
		exp++
	}
	return fmt.Sprintf("%.1f %cB", float64(f.Size)/float64(div), "KMGTPE"[exp])
}

// FileItemResponse structure for API responses
type FileItemResponse struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Ext         string    `json:"ext"`
	Mime        string    `json:"mime"`
	Size        int64     `json:"size"`
	SizeFormatted string  `json:"size_formatted"`
	CreatedAt   time.Time `json:"created_at"`
	HasPreview  bool      `json:"has_preview"`
	HasThumbnail bool     `json:"has_thumbnail"`
	ThumbUrl    string    `json:"thumb_url,omitempty"`
}

// ToResponse converts FileItem to FileItemResponse
func (f *FileItem) ToResponse() FileItemResponse {
	resp := FileItemResponse{
		ID:            f.ID,
		Name:          f.Name,
		Ext:           f.Ext,
		Mime:          f.Mime,
		Size:          f.Size,
		SizeFormatted: f.FormatSize(),
		CreatedAt:     f.CreatedAt,
		HasPreview:    f.IsPreviewable(),
		HasThumbnail:  f.HasThumbnail(),
	}
	
	if f.HasThumbnail() {
		resp.ThumbUrl = "/files/" + f.ID + "/thumb"
	}
	
	return resp
}
