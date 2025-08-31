package main

import (
	"log"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"

	"tokilane/internal/config"
	"tokilane/internal/db"
	"tokilane/internal/files"
	"tokilane/internal/web"
)

func main() {
	// Charger la configuration
	cfg := config.Load()

	log.Printf("Démarrage de Tokilane...")
	log.Printf("Configuration: Port=%s, FilesRoot=%s, Debug=%v", cfg.Port, cfg.FilesRoot, cfg.Debug)

	// Créer les dossiers nécessaires
	if err := ensureDirectories(cfg); err != nil {
		log.Fatalf("Erreur lors de la création des dossiers: %v", err)
	}

	// Initialiser la base de données
	database, err := db.New(cfg.DBPath, cfg.Debug)
	if err != nil {
		log.Fatalf("Erreur lors de l'initialisation de la base de données: %v", err)
	}
	defer func() {
		if err := database.Close(); err != nil {
			log.Printf("Erreur lors de la fermeture de la base de données: %v", err)
		}
	}()

	// Initialiser l'indexeur de fichiers
	indexerConfig := &files.IndexerConfig{
		RootPath:   cfg.FilesRoot,
		ThumbsPath: filepath.Join(filepath.Dir(cfg.DBPath), "thumbs"),
		Debug:      cfg.Debug,
	}

	indexer, err := files.NewIndexer(indexerConfig, database)
	if err != nil {
		log.Fatalf("Erreur lors de l'initialisation de l'indexeur: %v", err)
	}

	// Démarrer l'indexeur
	if err := indexer.Start(); err != nil {
		log.Fatalf("Erreur lors du démarrage de l'indexeur: %v", err)
	}
	defer func() {
		if err := indexer.Stop(); err != nil {
			log.Printf("Erreur lors de l'arrêt de l'indexeur: %v", err)
		}
	}()

	// Initialiser le serveur web
	server := web.NewServer(cfg, database, indexer)

	// Canal pour gérer l'arrêt gracieux
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	// Démarrer le serveur dans une goroutine
	go func() {
		if err := server.Start(); err != nil {
			log.Printf("Erreur du serveur: %v", err)
			quit <- syscall.SIGTERM
		}
	}()

	// Optionnel: Écouter les événements de l'indexeur pour des logs
	go func() {
		for event := range indexer.GetEventChannel() {
			if cfg.Debug {
				log.Printf("Événement fichier: %s - %s", event.Type, event.FilePath)
			}
		}
	}()

	// Attendre le signal d'arrêt
	<-quit
	log.Println("Arrêt du serveur...")

	// Arrêt gracieux
	if err := server.Stop(); err != nil {
		log.Printf("Erreur lors de l'arrêt du serveur: %v", err)
	}

	log.Println("Serveur arrêté")
}

// ensureDirectories crée les dossiers nécessaires s'ils n'existent pas
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

	// Créer un fichier d'exemple dans le dossier files si vide
	if isEmpty, err := isDirEmpty(cfg.FilesRoot); err == nil && isEmpty {
		createSampleFiles(cfg.FilesRoot)
	}

	return nil
}

// isDirEmpty vérifie si un dossier est vide
func isDirEmpty(path string) (bool, error) {
	entries, err := os.ReadDir(path)
	if err != nil {
		return false, err
	}
	return len(entries) == 0, nil
}

// createSampleFiles crée quelques fichiers d'exemple
func createSampleFiles(rootPath string) {
	sampleContent := `# Bienvenue dans Tokilane

Ceci est un fichier d'exemple pour démontrer les fonctionnalités de Tokilane.

## Fonctionnalités

- 📁 Indexation automatique des fichiers
- 🔍 Recherche et filtrage
- 📅 Timeline organisée par date
- 👁️  Aperçu des fichiers (PDF, images, texte)
- 📤 Upload drag & drop
- 🖼️  Miniatures automatiques

## Types de fichiers supportés

- Images: JPG, PNG, GIF, WebP, SVG
- Documents: PDF, TXT, MD
- Archives: ZIP
- Médias: MP4, MP3
- Office: DOCX, XLSX

Vous pouvez ajouter vos propres fichiers dans le dossier 'files/' ou utiliser la fonction d'upload.
`

	samplePath := filepath.Join(rootPath, "README.md")
	if err := os.WriteFile(samplePath, []byte(sampleContent), 0644); err != nil {
		log.Printf("Impossible de créer le fichier d'exemple: %v", err)
	} else {
		log.Printf("Fichier d'exemple créé: %s", samplePath)
	}
}
