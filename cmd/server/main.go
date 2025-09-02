package main

import (
	"log"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"

	"tokilane/internal/config"
	"tokilane/internal/db"
	"tokilane/internal/content"
	"tokilane/internal/web"
)

func main() {
	// Load configuration
	cfg := config.Load()

	log.Printf("Starting Tokilane...")
	log.Printf("Configuration: Port=%s, FilesRoot=%s, Debug=%v, AppLang=%s", cfg.Port, cfg.FilesRoot, cfg.Debug, cfg.AppLang)

	// Create necessary directories
	if err := ensureDirectories(cfg); err != nil {
		log.Fatalf("Error creating directories: %v", err)
	}

	// Initialize database
	database, err := db.New(cfg.DBPath, cfg.Debug)
	if err != nil {
		log.Fatalf("Error initializing database: %v", err)
	}
	defer func() {
		if err := database.Close(); err != nil {
			log.Printf("Error closing database: %v", err)
		}
	}()

	// Initialize file indexer
	indexerConfig := &content.IndexerConfig{
		RootPath:   cfg.FilesRoot,
		ThumbsPath: filepath.Join(filepath.Dir(cfg.DBPath), "thumbs"),
		Debug:      cfg.Debug,
	}

	indexer, err := content.NewIndexer(indexerConfig, database)
	if err != nil {
		log.Fatalf("Error initializing indexer: %v", err)
	}

	// Start indexer
	if err := indexer.Start(); err != nil {
		log.Fatalf("Error starting indexer: %v", err)
	}
	defer func() {
		if err := indexer.Stop(); err != nil {
			log.Printf("Error stopping indexer: %v", err)
		}
	}()

	// Initialize web server
	server := web.NewServer(cfg, database, indexer)

	// Channel to handle graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	// Start server in a goroutine
	go func() {
		if err := server.Start(); err != nil {
			log.Printf("Server error: %v", err)
			quit <- syscall.SIGTERM
		}
	}()

	// Optional: Listen to indexer events for logging
	go func() {
		for event := range indexer.GetEventChannel() {
			if cfg.Debug {
				log.Printf("File event: %s - %s", event.Type, event.FilePath)
			}
		}
	}()

	// Wait for shutdown signal
	<-quit
	log.Println("Shutting down server...")

	// Graceful shutdown
	if err := server.Stop(); err != nil {
		log.Printf("Error shutting down server: %v", err)
	}

	log.Println("Server stopped")
}

// ensureDirectories creates necessary directories if they don't exist
func ensureDirectories(cfg *config.Config) error {
	dirs := []string{
		cfg.FilesRoot,
		filepath.Dir(cfg.DBPath),
		filepath.Join(filepath.Dir(cfg.DBPath), "thumbs"),
	}

	for _, dir := range dirs {
		if err := os.MkdirAll(dir, 0755); err != nil {
			return err
		}
	}

	// Create a sample file in the files folder if empty
	if isEmpty, err := isDirEmpty(cfg.FilesRoot); err == nil && isEmpty {
		createSampleFiles(cfg.FilesRoot)
	}

	return nil
}

// isDirEmpty checks if a directory is empty
func isDirEmpty(path string) (bool, error) {
	entries, err := os.ReadDir(path)
	if err != nil {
		return false, err
	}
	return len(entries) == 0, nil
}

// createSampleFiles creates some sample files
func createSampleFiles(rootPath string) {
	sampleContent := `# Welcome to Tokilane

This is a sample file to demonstrate Tokilane's features.

## Features

- 📁 Automatic file indexing
- 🔍 Search and filtering
- 📅 Timeline organized by date
- 👁️  File preview (PDF, images, text)
- 📤 Drag & drop upload
- 🖼️  Automatic thumbnails

## Supported file types

- Images: JPG, PNG, GIF, WebP, SVG
- Documents: PDF, TXT, MD
- Archives: ZIP
- Media: MP4, MP3
- Office: DOCX, XLSX

You can add your own files to the 'files/' folder or use the upload feature.
`

	samplePath := filepath.Join(rootPath, "README.md")
	if err := os.WriteFile(samplePath, []byte(sampleContent), 0644); err != nil {
		log.Printf("Unable to create sample file: %v", err)
	} else {
		log.Printf("Sample file created: %s", samplePath)
	}
}
