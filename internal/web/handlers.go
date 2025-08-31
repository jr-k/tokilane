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

// Handlers contient tous les handlers de l'application
type Handlers struct {
	config       *config.Config
	repo         *db.FileItemRepository
	thumbnailSvc *files.ThumbnailService
	indexer      *files.Indexer
}

// NewHandlers crée une nouvelle instance des handlers
func NewHandlers(cfg *config.Config, repo *db.FileItemRepository, thumbnailSvc *files.ThumbnailService, indexer *files.Indexer) *Handlers {
	return &Handlers{
		config:       cfg,
		repo:         repo,
		thumbnailSvc: thumbnailSvc,
		indexer:      indexer,
	}
}

// TimelinePage affiche la page principale de la timeline
func (h *Handlers) TimelinePage(c echo.Context) error {
	// Pour l'instant, servir le fichier HTML statique
	// En production, cela sera géré par Vite build
	return c.File("web/index.html")
}

// GetTimelineData récupère les données pour la timeline
func (h *Handlers) GetTimelineData(c echo.Context) error {
	// Récupérer les filtres depuis les paramètres de requête
	filters := h.parseFilters(c)

	// Récupérer les fichiers groupés par date
	groupedFiles, err := h.repo.GetGroupedByDate(filters)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Erreur lors de la récupération des fichiers",
		})
	}

	// Convertir en format pour le frontend
	timelineData := make(map[string]interface{})
	for date, items := range groupedFiles {
		var responseItems []db.FileItemResponse
		for _, item := range items {
			responseItems = append(responseItems, item.ToResponse())
		}
		timelineData[date] = responseItems
	}

	// Compter le total de fichiers pour les statistiques
	totalResult, err := h.repo.List(db.ListFilters{Page: 1, PageSize: 1})
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Erreur lors du comptage des fichiers",
		})
	}

	// Préparer la réponse
	response := map[string]interface{}{
		"timeline":     timelineData,
		"filters":      filters,
		"total":        totalResult.Total,
		"enableUpload": h.config.EnableUpload,
		"allowedExt":   h.config.AllowedExt,
	}

	return c.JSON(http.StatusOK, response)
}

// ListFiles API pour récupérer la liste des fichiers avec pagination
func (h *Handlers) ListFiles(c echo.Context) error {
	filters := h.parseFilters(c)
	
	result, err := h.repo.List(filters)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Erreur lors de la récupération des fichiers",
		})
	}

	// Convertir en format response
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

// GetFile récupère les métadonnées détaillées d'un fichier
func (h *Handlers) GetFile(c echo.Context) error {
	fileID := c.Param("id")
	
	item, err := h.repo.GetByID(fileID)
	if err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{
			"error": "Fichier non trouvé",
		})
	}

	// Informations supplémentaires pour les détails
	response := item.ToResponse()
	
	// Ajouter le chemin complet (pour copier le chemin)
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

// PreviewFile sert le contenu d'un fichier pour prévisualisation ou téléchargement
func (h *Handlers) PreviewFile(c echo.Context) error {
	fileID := c.Param("id")
	download := c.QueryParam("download") == "1"
	
	item, err := h.repo.GetByID(fileID)
	if err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{
			"error": "Fichier non trouvé",
		})
	}

	// Vérifier que le fichier existe sur le disque
	if _, err := os.Stat(item.AbsPath); os.IsNotExist(err) {
		return c.JSON(http.StatusNotFound, map[string]string{
			"error": "Fichier physique non trouvé",
		})
	}

	// Valider le chemin pour éviter path traversal
	if err := files.ValidatePath(h.config.FilesRoot, item.AbsPath); err != nil {
		return c.JSON(http.StatusForbidden, map[string]string{
			"error": "Accès non autorisé",
		})
	}

	// Configurer les headers
	c.Response().Header().Set("Content-Type", item.Mime)
	
	if download {
		c.Response().Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", item.Name))
	} else {
		// Pour la prévisualisation, ajouter cache headers
		c.Response().Header().Set("Cache-Control", "public, max-age=3600")
		c.Response().Header().Set("ETag", fmt.Sprintf("\"%s\"", item.Hash))
	}

	return c.File(item.AbsPath)
}

// ThumbnailFile sert la miniature d'un fichier
func (h *Handlers) ThumbnailFile(c echo.Context) error {
	fileID := c.Param("id")
	
	item, err := h.repo.GetByID(fileID)
	if err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{
			"error": "Fichier non trouvé",
		})
	}

	// Vérifier si le fichier a une miniature
	if !item.HasThumbnail() {
		return c.JSON(http.StatusNotFound, map[string]string{
			"error": "Miniature non disponible",
		})
	}

	// Vérifier que la miniature existe
	if _, err := os.Stat(*item.ThumbPath); os.IsNotExist(err) {
		return c.JSON(http.StatusNotFound, map[string]string{
			"error": "Miniature physique non trouvée",
		})
	}

	// Headers pour le cache
	c.Response().Header().Set("Content-Type", "image/jpeg")
	c.Response().Header().Set("Cache-Control", "public, max-age=86400") // 24h
	
	return c.File(*item.ThumbPath)
}

// UploadFiles gère l'upload de fichiers
func (h *Handlers) UploadFiles(c echo.Context) error {
	if !h.config.EnableUpload {
		return c.JSON(http.StatusForbidden, map[string]string{
			"error": "Upload désactivé",
		})
	}

	// Parse multipart form
	form, err := c.MultipartForm()
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Erreur lors du parsing du formulaire",
		})
	}

	files := form.File["files"]
	if len(files) == 0 {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Aucun fichier fourni",
		})
	}

	var uploadedFiles []string
	var errors []string

	// Créer le dossier d'upload avec la date actuelle
	now := time.Now()
	uploadDir := filepath.Join(h.config.FilesRoot, "uploads", now.Format("2006"), now.Format("01"))
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Impossible de créer le dossier d'upload",
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

// uploadSingleFile upload un fichier unique
func (h *Handlers) uploadSingleFile(fileHeader *multipart.FileHeader, uploadDir string) (string, error) {
	// Vérifier la taille
	maxSize := h.config.MaxUploadSize * 1024 * 1024 // Convertir MB en bytes
	if fileHeader.Size > maxSize {
		return "", fmt.Errorf("fichier trop volumineux (max %dMB)", h.config.MaxUploadSize)
	}

	// Vérifier l'extension
	ext := files.GetFileExtension(fileHeader.Filename)
	if !h.config.IsAllowedExtension(ext) {
		return "", fmt.Errorf("extension non autorisée: %s", ext)
	}

	// Ouvrir le fichier source
	src, err := fileHeader.Open()
	if err != nil {
		return "", err
	}
	defer src.Close()

	// Créer le chemin de destination
	destPath := filepath.Join(uploadDir, fileHeader.Filename)
	
	// Si un fichier avec le même nom existe, ajouter un suffixe
	counter := 1
	for {
		if _, err := os.Stat(destPath); os.IsNotExist(err) {
			break
		}
		
		// Ajouter un suffixe numérique
		name := strings.TrimSuffix(fileHeader.Filename, ext)
		destPath = filepath.Join(uploadDir, fmt.Sprintf("%s_%d%s", name, counter, ext))
		counter++
	}

	// Créer le fichier de destination
	dst, err := os.Create(destPath)
	if err != nil {
		return "", err
	}
	defer dst.Close()

	// Copier le contenu
	if _, err := io.Copy(dst, src); err != nil {
		os.Remove(destPath) // Nettoyer en cas d'erreur
		return "", err
	}

	// L'indexeur va automatiquement détecter le nouveau fichier
	// via fsnotify, mais on peut forcer une indexation immédiate
	go func() {
		time.Sleep(100 * time.Millisecond) // Petit délai pour que le fichier soit complètement écrit
		if err := h.indexer.ScanAll(); err != nil {
			fmt.Printf("Erreur lors de l'indexation après upload: %v\n", err)
		}
	}()

	// Retourner un ID temporaire (le vrai ID sera généré lors de l'indexation)
	return filepath.Base(destPath), nil
}

// parseFilters parse les filtres depuis les paramètres de requête
func (h *Handlers) parseFilters(c echo.Context) db.ListFilters {
	filters := db.ListFilters{
		Query:     c.QueryParam("q"),
		Extension: c.QueryParam("ext"),
		Page:      1,
		PageSize:  50,
	}

	// Parse page
	if pageStr := c.QueryParam("page"); pageStr != "" {
		if page, err := strconv.Atoi(pageStr); err == nil && page > 0 {
			filters.Page = page
		}
	}

	// Parse page size
	if pageSizeStr := c.QueryParam("page_size"); pageSizeStr != "" {
		if pageSize, err := strconv.Atoi(pageSizeStr); err == nil && pageSize > 0 && pageSize <= 200 {
			filters.PageSize = pageSize
		}
	}

	// Parse dates
	if dateFrom := c.QueryParam("date_from"); dateFrom != "" {
		filters.DateFrom = &dateFrom
	}
	if dateTo := c.QueryParam("date_to"); dateTo != "" {
		filters.DateTo = &dateTo
	}

	// Parse sizes
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
