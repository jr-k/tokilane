package config

import (
	"os"
	"strconv"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	Port           string
	FilesRoot      string
	EnableUpload   bool
	AllowedExt     []string
	DBPath         string
	Debug          bool
	MaxUploadSize  int64 // en MB
}

func Load() *Config {
	// Charger le fichier .env s'il existe
	_ = godotenv.Load()

	return &Config{
		Port:          getEnv("PORT", "1323"),
		FilesRoot:     getEnv("FILES_ROOT", "./files"),
		EnableUpload:  getEnvBool("ENABLE_UPLOAD", true),
		AllowedExt:    getEnvSlice("ALLOWED_EXT", []string{".pdf", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".txt", ".md", ".docx", ".xlsx", ".zip", ".mp4", ".mp3"}),
		DBPath:        getEnv("DB_PATH", "./data/app.db"),
		Debug:         getEnvBool("DEBUG", true),
		MaxUploadSize: getEnvInt64("MAX_UPLOAD_SIZE", 100), // 100MB par défaut
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvBool(key string, defaultValue bool) bool {
	if value := os.Getenv(key); value != "" {
		if parsed, err := strconv.ParseBool(value); err == nil {
			return parsed
		}
	}
	return defaultValue
}

func getEnvInt64(key string, defaultValue int64) int64 {
	if value := os.Getenv(key); value != "" {
		if parsed, err := strconv.ParseInt(value, 10, 64); err == nil {
			return parsed
		}
	}
	return defaultValue
}

func getEnvSlice(key string, defaultValue []string) []string {
	if value := os.Getenv(key); value != "" {
		return strings.Split(value, ",")
	}
	return defaultValue
}

// IsAllowedExtension vérifie si l'extension est autorisée
func (c *Config) IsAllowedExtension(ext string) bool {
	ext = strings.ToLower(ext)
	for _, allowed := range c.AllowedExt {
		if strings.ToLower(allowed) == ext {
			return true
		}
	}
	return false
}
