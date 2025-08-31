package web

import (
	"log"
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"

	"tokilane/internal/config"
	"tokilane/internal/db"
	"tokilane/internal/files"
)

// Server représente le serveur web
type Server struct {
	echo     *echo.Echo
	config   *config.Config
	handlers *Handlers
}

// NewServer crée un nouveau serveur
func NewServer(cfg *config.Config, database *db.Database, indexer *files.Indexer) *Server {
	e := echo.New()
	
	// Configuration d'Echo
	e.HideBanner = true
	if cfg.Debug {
		e.Debug = true
	}

	// Repository et services
	repo := db.NewFileItemRepository(database)
	thumbnailSvc := files.NewThumbnailService(cfg.DBPath + "/../thumbs")
	
	// Handlers
	handlers := NewHandlers(cfg, repo, thumbnailSvc, indexer)

	server := &Server{
		echo:     e,
		config:   cfg,
		handlers: handlers,
	}

	server.setupMiddleware()
	server.setupRoutes()

	return server
}

// setupMiddleware configure les middlewares
func (s *Server) setupMiddleware() {
	// Logger
	if s.config.Debug {
		s.echo.Use(middleware.Logger())
	}

	// Recovery
	s.echo.Use(middleware.Recover())

	// CORS
	s.echo.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: []string{"*"},
		AllowMethods: []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodDelete},
		AllowHeaders: []string{"*"},
	}))

	// Gzip
	s.echo.Use(middleware.Gzip())

	// Security headers
	s.echo.Use(middleware.SecureWithConfig(middleware.SecureConfig{
		XSSProtection:         "1; mode=block",
		ContentTypeNosniff:    "nosniff",
		XFrameOptions:         "DENY",
		HSTSMaxAge:           3600,
		ContentSecurityPolicy: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self';",
	}))

	// CORS doit être avant les autres middlewares
	// (déjà configuré plus haut)

	// Rate limiting (plus généreux pour le développement)
	s.echo.Use(middleware.RateLimiter(middleware.NewRateLimiterMemoryStore(100)))

	// Static files pour le frontend (en production)
	s.echo.Static("/dist", "dist")
	s.echo.Static("/assets", "dist/assets")
}

// setupRoutes configure les routes
func (s *Server) setupRoutes() {
	// API routes
	api := s.echo.Group("/api")
	{
		api.GET("/timeline", s.handlers.GetTimelineData)
		api.GET("/files", s.handlers.ListFiles)
		api.GET("/files/:id", s.handlers.GetFile)
		
		// Upload (si activé)
		if s.config.EnableUpload {
			api.POST("/upload", s.handlers.UploadFiles)
		}
	}

	// Routes pour servir les fichiers
	files := s.echo.Group("/files")
	{
		files.GET("/:id/preview", s.handlers.PreviewFile)
		files.GET("/:id/thumb", s.handlers.ThumbnailFile)
	}

	// Page principale (sera servie par Vite en dev)
	s.echo.GET("/", s.handlers.TimelinePage)

	// Routes pour le développement (servies par Vite en dev)
	if s.config.Debug {
		// Proxy vers Vite dev server
		s.setupDevProxy()
	}
}

// setupDevProxy configure le proxy vers Vite en développement
func (s *Server) setupDevProxy() {
	// En mode développement, on peut soit:
	// 1. Servir directement depuis dist/ si Vite a build
	// 2. Proxy vers le dev server Vite (http://localhost:5173)
	// 
	// Pour simplifier, on va juste servir les assets statiques
	// et laisser Vite gérer le dev server séparément
	
	log.Println("Mode développement: les assets frontend doivent être servis par Vite")
}

// Start démarre le serveur
func (s *Server) Start() error {
	addr := ":" + s.config.Port
	log.Printf("Serveur démarré sur http://localhost%s", addr)
	
	if s.config.Debug {
		log.Println("Mode debug activé")
		log.Printf("Dossier des fichiers: %s", s.config.FilesRoot)
		log.Printf("Upload activé: %v", s.config.EnableUpload)
	}

	return s.echo.Start(addr)
}

// Stop arrête le serveur
func (s *Server) Stop() error {
	log.Println("Arrêt du serveur...")
	return s.echo.Close()
}

// Health endpoint pour vérifier l'état du serveur
func (s *Server) HealthCheck(c echo.Context) error {
	return c.JSON(http.StatusOK, map[string]interface{}{
		"status":       "ok",
		"version":      "1.0.0",
		"upload":       s.config.EnableUpload,
		"files_root":   s.config.FilesRoot,
		"allowed_ext":  s.config.AllowedExt,
	})
}
