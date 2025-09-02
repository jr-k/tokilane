package content

import (
	"fmt"
	"image"
	"os"
	"path/filepath"
	"strings"

	"github.com/disintegration/imaging"
)

// ThumbnailService gère la génération de miniatures
type ThumbnailService struct {
	thumbsDir string
	maxWidth  int
	maxHeight int
}

// NewThumbnailService crée un nouveau service de miniatures
func NewThumbnailService(thumbsDir string) *ThumbnailService {
	return &ThumbnailService{
		thumbsDir: thumbsDir,
		maxWidth:  512,
		maxHeight: 512,
	}
}

// GenerateIfNeeded génère une miniature si nécessaire pour un fichier image
func (s *ThumbnailService) GenerateIfNeeded(fileID, filePath, mimeType string) (string, error) {
	// Vérifier si c'est une image
	if !IsImageFile(mimeType) {
		return "", nil
	}

	// Ignorer les SVG (pas besoin de miniature)
	if mimeType == "image/svg+xml" {
		return "", nil
	}

	// Créer le dossier de miniatures s'il n'existe pas
	if err := EnsureDir(s.thumbsDir); err != nil {
		return "", fmt.Errorf("impossible de créer le dossier de miniatures: %w", err)
	}

	// Chemin de la miniature
	thumbPath := filepath.Join(s.thumbsDir, fileID+".jpg")

	// Vérifier si la miniature existe déjà
	if _, err := os.Stat(thumbPath); err == nil {
		return thumbPath, nil
	}

	// Générer la miniature
	if err := s.generateThumbnail(filePath, thumbPath); err != nil {
		return "", fmt.Errorf("erreur lors de la génération de la miniature: %w", err)
	}

	return thumbPath, nil
}

// generateThumbnail génère une miniature pour une image
func (s *ThumbnailService) generateThumbnail(inputPath, outputPath string) error {
	// Ouvrir l'image source
	src, err := imaging.Open(inputPath)
	if err != nil {
		return fmt.Errorf("impossible d'ouvrir l'image: %w", err)
	}

	// Redimensionner en gardant les proportions
	thumbnail := imaging.Fit(src, s.maxWidth, s.maxHeight, imaging.Lanczos)

	// Sauvegarder en JPEG avec qualité 85
	if err := imaging.Save(thumbnail, outputPath, imaging.JPEGQuality(85)); err != nil {
		return fmt.Errorf("impossible de sauvegarder la miniature: %w", err)
	}

	return nil
}

// DeleteThumbnail supprime la miniature d'un fichier
func (s *ThumbnailService) DeleteThumbnail(fileID string) error {
	thumbPath := filepath.Join(s.thumbsDir, fileID+".jpg")
	
	if _, err := os.Stat(thumbPath); os.IsNotExist(err) {
		return nil // Pas de miniature à supprimer
	}

	return os.Remove(thumbPath)
}

// GetThumbnailPath retourne le chemin d'une miniature si elle existe
func (s *ThumbnailService) GetThumbnailPath(fileID string) (string, bool) {
	thumbPath := filepath.Join(s.thumbsDir, fileID+".jpg")
	
	if _, err := os.Stat(thumbPath); err == nil {
		return thumbPath, true
	}
	
	return "", false
}

// CleanupOrphanedThumbnails supprime les miniatures orphelines
func (s *ThumbnailService) CleanupOrphanedThumbnails(existingFileIDs []string) error {
	// Lire le contenu du dossier de miniatures
	entries, err := os.ReadDir(s.thumbsDir)
	if err != nil {
		if os.IsNotExist(err) {
			return nil // Dossier n'existe pas, rien à nettoyer
		}
		return fmt.Errorf("impossible de lire le dossier de miniatures: %w", err)
	}

	// Créer un map pour une recherche rapide
	fileIDMap := make(map[string]bool)
	for _, id := range existingFileIDs {
		fileIDMap[id] = true
	}

	// Parcourir les miniatures et supprimer les orphelines
	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}

		// Extraire l'ID du fichier à partir du nom de la miniature
		name := entry.Name()
		if !strings.HasSuffix(name, ".jpg") {
			continue
		}

		fileID := strings.TrimSuffix(name, ".jpg")
		
		// Vérifier si le fichier existe encore
		if !fileIDMap[fileID] {
			thumbPath := filepath.Join(s.thumbsDir, name)
			if err := os.Remove(thumbPath); err != nil {
				fmt.Printf("Erreur lors de la suppression de la miniature orpheline %s: %v\n", thumbPath, err)
			}
		}
	}

	return nil
}

// GetImageDimensions retourne les dimensions d'une image
func (s *ThumbnailService) GetImageDimensions(imagePath string) (int, int, error) {
	file, err := os.Open(imagePath)
	if err != nil {
		return 0, 0, err
	}
	defer file.Close()

	config, _, err := image.DecodeConfig(file)
	if err != nil {
		return 0, 0, err
	}

	return config.Width, config.Height, nil
}
