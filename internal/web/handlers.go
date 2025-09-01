package web

import (
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/labstack/echo/v4"

	"tokilane/internal/config"
	"tokilane/internal/db"
	"tokilane/internal/files"
)

// Handlers contains all application handlers
type Handlers struct {
	config       *config.Config
	repo         *db.FileItemRepository
	thumbnailSvc *files.ThumbnailService
	indexer      *files.Indexer
}

// NewHandlers creates a new handlers instance
func NewHandlers(cfg *config.Config, repo *db.FileItemRepository, thumbnailSvc *files.ThumbnailService, indexer *files.Indexer) *Handlers {
	return &Handlers{
		config:       cfg,
		repo:         repo,
		thumbnailSvc: thumbnailSvc,
		indexer:      indexer,
	}
}

// TimelinePage displays the main timeline page
func (h *Handlers) TimelinePage(c echo.Context) error {
	// For now, serve the static HTML file
	// In production, this will be handled by Vite build
	return c.File("web/index.html")
}

// GetTimelineData retrieves the data for the timeline
func (h *Handlers) GetTimelineData(c echo.Context) error {
	// Retrieve the filters from the query parameters
	filters := h.parseFilters(c)

	// Retrieve the files grouped by date
	groupedFiles, err := h.repo.GetGroupedByDate(filters)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Error retrieving files",
		})
	}

	// Convert to format for the frontend
	timelineData := make(map[string]interface{})
	for date, items := range groupedFiles {
		var responseItems []db.FileItemResponse
		for _, item := range items {
			responseItems = append(responseItems, item.ToResponse())
		}
		timelineData[date] = responseItems
	}

	// Count the total number of files for statistics
	totalResult, err := h.repo.List(db.ListFilters{Page: 1, PageSize: 1})
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Error counting files",
		})
	}

	// Prepare the response
	response := map[string]interface{}{
		"timeline":     timelineData,
		"filters":      filters,
		"total":        totalResult.Total,
		"enableUpload": h.config.EnableUpload,
		"allowedExt":   h.config.AllowedExt,
	}

	return c.JSON(http.StatusOK, response)
}

// GetAppConfig returns application configuration including language
func (h *Handlers) GetAppConfig(c echo.Context) error {
	response := map[string]interface{}{
		"app_lang":     h.config.AppLang,
		"version":      "1.0.0",
		"upload":       h.config.EnableUpload,
		"files_root":   h.config.FilesRoot,
		"allowed_ext":  h.config.AllowedExt,
	}

	return c.JSON(http.StatusOK, response)
}

// ListFiles API to retrieve the list of files with pagination
func (h *Handlers) ListFiles(c echo.Context) error {
	filters := h.parseFilters(c)
	
	result, err := h.repo.List(filters)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Error retrieving files",
		})
	}

	// Convert to format response
	var responseItems []db.FileItemResponse
	for _, item := range result.Items {
		responseItems = append(responseItems, item.ToResponse())
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"items":       responseItems,
		"total":       result.Total,
		"page":        result.Page,
		"page_size":   result.PageSize,
		"total_pages": result.TotalPages,
	})
}

// GetFile retrieves the detailed metadata of a file
func (h *Handlers) GetFile(c echo.Context) error {
	fileID := c.Param("id")
	
	item, err := h.repo.GetByID(fileID)
	if err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{
			"error": "File not found",
		})
	}

	// Additional information for the details
	response := item.ToResponse()
	
	// Add the full path (for copying the path)
	detailedResponse := map[string]interface{}{
		"id":             response.ID,
		"name":           response.Name,
		"ext":            response.Ext,
		"mime":           response.Mime,
		"size":           response.Size,
		"size_formatted": response.SizeFormatted,
		"created_at":     response.CreatedAt,
		"has_preview":    response.HasPreview,
		"has_thumbnail":  response.HasThumbnail,
		"thumb_url":      response.ThumbUrl,
		"abs_path":       item.AbsPath,
		"hash":           item.Hash,
		"added_at":       item.AddedAt,
	}

	return c.JSON(http.StatusOK, detailedResponse)
}

// PreviewFile serves the content of a file for preview or download
func (h *Handlers) PreviewFile(c echo.Context) error {
	fileID := c.Param("id")
	download := c.QueryParam("download") == "1"
	
	item, err := h.repo.GetByID(fileID)
	if err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{
			"error": "File not found",
		})
	}

	// Check if the file exists on the disk
	if _, err := os.Stat(item.AbsPath); os.IsNotExist(err) {
		return c.JSON(http.StatusNotFound, map[string]string{
			"error": "Physical file not found",
		})
	}

	// Validate path to prevent path traversal
	if err := files.ValidatePath(h.config.FilesRoot, item.AbsPath); err != nil {
		return c.JSON(http.StatusForbidden, map[string]string{
			"error": "Access denied",
		})
	}

	// Configure the headers
	c.Response().Header().Set("Content-Type", item.Mime)
	
	if download {
		c.Response().Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", item.Name))
	} else {
		// For preview, add cache headers
		c.Response().Header().Set("Cache-Control", "public, max-age=3600")
		c.Response().Header().Set("ETag", fmt.Sprintf("\"%s\"", item.Hash))
	}

	return c.File(item.AbsPath)
}

// ThumbnailFile serves the thumbnail of a file
func (h *Handlers) ThumbnailFile(c echo.Context) error {
	fileID := c.Param("id")
	
	item, err := h.repo.GetByID(fileID)
	if err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{
			"error": "File not found",
		})
	}

	// Check if the file has a thumbnail
	if !item.HasThumbnail() {
		return c.JSON(http.StatusNotFound, map[string]string{
			"error": "Thumbnail not available",
		})
	}

	// Check if the thumbnail exists
	if _, err := os.Stat(*item.ThumbPath); os.IsNotExist(err) {
		return c.JSON(http.StatusNotFound, map[string]string{
			"error": "Physical thumbnail not found",
		})
	}

	// Headers for the cache
	c.Response().Header().Set("Content-Type", "image/jpeg")
	c.Response().Header().Set("Cache-Control", "public, max-age=86400") // 24h
	
	return c.File(*item.ThumbPath)
}

// UploadFiles manages the upload of files
func (h *Handlers) UploadFiles(c echo.Context) error {
	if !h.config.EnableUpload {
		return c.JSON(http.StatusForbidden, map[string]string{
			"error": "Upload disabled",
		})
	}

	// Parse multipart form
	form, err := c.MultipartForm()
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Error parsing form",
		})
	}

	files := form.File["files"]
	if len(files) == 0 {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "No files provided",
		})
	}

	var uploadedFiles []string
	var errors []string

	// Create the upload directory with the current date
	now := time.Now()
	uploadDir := filepath.Join(h.config.FilesRoot, "uploads", now.Format("2006"), now.Format("01"))
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Unable to create upload directory",
		})
	}

	for _, file := range files {
		fileID, err := h.uploadSingleFile(file, uploadDir)
		if err != nil {
			errors = append(errors, fmt.Sprintf("%s: %v", file.Filename, err))
		} else {
			uploadedFiles = append(uploadedFiles, fileID)
		}
	}

	result := map[string]interface{}{
		"uploaded": uploadedFiles,
		"count":    len(uploadedFiles),
	}

	if len(errors) > 0 {
		result["errors"] = errors
	}

	return c.JSON(http.StatusOK, result)
}

// uploadSingleFile upload a single file
func (h *Handlers) uploadSingleFile(fileHeader *multipart.FileHeader, uploadDir string) (string, error) {
	// Check the size
	maxSize := h.config.MaxUploadSize * 1024 * 1024 // Convertir MB en bytes
	if fileHeader.Size > maxSize {
		return "", fmt.Errorf("file too large (max %dMB)", h.config.MaxUploadSize)
	}

	// Check the extension
	ext := files.GetFileExtension(fileHeader.Filename)
	if !h.config.IsAllowedExtension(ext) {
		return "", fmt.Errorf("extension not allowed: %s", ext)
	}

	// Open the source file
	src, err := fileHeader.Open()
	if err != nil {
		return "", err
	}
	defer src.Close()

	// Create the destination path
	destPath := filepath.Join(uploadDir, fileHeader.Filename)
	
	// If a file with the same name exists, add a suffix
	counter := 1
	for {
		if _, err := os.Stat(destPath); os.IsNotExist(err) {
			break
		}
		
		// Add a numeric suffix
		name := strings.TrimSuffix(fileHeader.Filename, ext)
		destPath = filepath.Join(uploadDir, fmt.Sprintf("%s_%d%s", name, counter, ext))
		counter++
	}

	// Create the destination file
	dst, err := os.Create(destPath)
	if err != nil {
		return "", err
	}
	defer dst.Close()

	// Copy the content
	if _, err := io.Copy(dst, src); err != nil {
		os.Remove(destPath) // Nettoyer en cas d'erreur
		return "", err
	}

	// The indexer will automatically detect the new file
	// via fsnotify, mais on peut forcer une indexation immédiate
	go func() {
		time.Sleep(100 * time.Millisecond) // Small delay to ensure the file is completely written
		if err := h.indexer.ScanAll(); err != nil {
			fmt.Printf("Error during indexing after upload: %v\n", err)
		}
	}()

	// Return a temporary ID (the real ID will be generated during indexing)
	return filepath.Base(destPath), nil
}

// parseFilters parse the filters from the query parameters
func (h *Handlers) parseFilters(c echo.Context) db.ListFilters {
	filters := db.ListFilters{
		Query:     c.QueryParam("q"),
		Extension: c.QueryParam("ext"),
		Page:      1,
		PageSize:  50,
	}

	// Parse the page
	if pageStr := c.QueryParam("page"); pageStr != "" {
		if page, err := strconv.Atoi(pageStr); err == nil && page > 0 {
			filters.Page = page
		}
	}

	// Parse the page size
	if pageSizeStr := c.QueryParam("page_size"); pageSizeStr != "" {
		if pageSize, err := strconv.Atoi(pageSizeStr); err == nil && pageSize > 0 && pageSize <= 200 {
			filters.PageSize = pageSize
		}
	}

	// Parse the dates
	if dateFrom := c.QueryParam("date_from"); dateFrom != "" {
		filters.DateFrom = &dateFrom
	}
	if dateTo := c.QueryParam("date_to"); dateTo != "" {
		filters.DateTo = &dateTo
	}

	// Parse the sizes
	if minSizeStr := c.QueryParam("min_size"); minSizeStr != "" {
		if minSize, err := strconv.ParseInt(minSizeStr, 10, 64); err == nil {
			filters.MinSize = &minSize
		}
	}
	if maxSizeStr := c.QueryParam("max_size"); maxSizeStr != "" {
		if maxSize, err := strconv.ParseInt(maxSizeStr, 10, 64); err == nil {
			filters.MaxSize = &maxSize
		}
	}

	return filters
}
