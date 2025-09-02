package web

import (
	"log"
	"net/http"
	"os"
	"path/filepath"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"

	"tokilane/internal/config"
	"tokilane/internal/db"
	"tokilane/internal/content"
)

// Server represents the web server
type Server struct {
	echo     *echo.Echo
	config   *config.Config
	handlers *Handlers
}

// NewServer creates a new server
func NewServer(cfg *config.Config, database *db.Database, indexer *content.Indexer) *Server {
	e := echo.New()
	
	// Echo configuration
	e.HideBanner = true
	if cfg.Debug {
		e.Debug = true
	}

	// Repository and services
	repo := db.NewFileItemRepository(database)
	thumbnailSvc := content.NewThumbnailService(cfg.DBPath + "/../thumbs")
	
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

// setupMiddleware configure the middlewares
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

	// CORS must be before other middlewares
	// (already configured above)

	// Rate limiting (more generous for development)
	s.echo.Use(middleware.RateLimiter(middleware.NewRateLimiterMemoryStore(100)))

	// Static files for the frontend (in production)
	// Try different paths for static assets
	staticPaths := []string{"dist", "/app/dist"}
	for _, path := range staticPaths {
		if _, err := os.Stat(path); err == nil {
			s.echo.Static("/", path)
			s.echo.Static("/assets", filepath.Join(path, "assets"))
			log.Printf("Serving static files from: %s", path)
			break
		}
	}
}

// setupRoutes configure the routes
func (s *Server) setupRoutes() {
	// API routes
	api := s.echo.Group("/api")
	{
		api.GET("/config", s.handlers.GetAppConfig)
		api.GET("/timeline", s.handlers.GetTimelineData)
		api.GET("/files", s.handlers.ListFiles)
		api.GET("/files/:id", s.handlers.GetFile)
		
		// Upload (if enabled)
		if s.config.EnableUpload {
			api.POST("/upload", s.handlers.UploadFiles)
		}
	}

	// Routes for serving files
	files := s.echo.Group("/files")
	{
		files.GET("/:id/preview", s.handlers.PreviewFile)
		files.GET("/:id/thumb", s.handlers.ThumbnailFile)
	}

	// Main page (will be served by Vite in dev)
	s.echo.GET("/", s.handlers.TimelinePage)

	// Routes for development (served by Vite in dev)
	if s.config.Debug {
		// Proxy vers Vite dev server
		s.setupDevProxy()
	}
}

// setupDevProxy configure the proxy to Vite in development
func (s *Server) setupDevProxy() {
	// In development mode, we can either:
	// 1. Serve directly from dist/ if Vite has built
	// 2. Proxy to the Vite dev server (http://localhost:5173)
	// 
	// For simplicity, we'll just serve the static assets
	// and let Vite handle the dev server separately
	
	log.Println("Development mode: the frontend assets must be served by Vite")
}

// Start starts the server
func (s *Server) Start() error {
	addr := ":" + s.config.Port
	log.Printf("Server started on http://localhost%s", addr)
	
	if s.config.Debug {
		log.Println("Debug mode activated")
		log.Printf("Files folder: %s", s.config.FilesRoot)
		log.Printf("Upload activated: %v", s.config.EnableUpload)
	}

	return s.echo.Start(addr)
}

// Stop stops the server
func (s *Server) Stop() error {
	log.Println("Stopping server...")
	return s.echo.Close()
}

// Health endpoint to check the server state
func (s *Server) HealthCheck(c echo.Context) error {
	return c.JSON(http.StatusOK, map[string]interface{}{
		"status":       "ok",
		"version":      "1.0.0",
		"upload":       s.config.EnableUpload,
		"files_root":   s.config.FilesRoot,
		"allowed_ext":  s.config.AllowedExt,
	})
}
