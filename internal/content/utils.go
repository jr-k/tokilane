package content

import (
	"crypto/sha256"
	"fmt"
	"io"
	"mime"
	"os"
	"path/filepath"
	"reflect"
	"runtime"
	"strings"
	"syscall"
	"time"
)

// DetectMime detects the MIME type of a file
func DetectMime(path string) string {
	ext := strings.ToLower(filepath.Ext(path))
	mimeType := mime.TypeByExtension(ext)
	
	if mimeType != "" {
		return mimeType
	}
	
	// Fallback for some common types
	switch ext {
	case ".md":
		return "text/markdown"
	case ".txt":
		return "text/plain"
	case ".pdf":
		return "application/pdf"
	case ".jpg", ".jpeg":
		return "image/jpeg"
	case ".png":
		return "image/png"
	case ".gif":
		return "image/gif"
	case ".webp":
		return "image/webp"
	case ".svg":
		return "image/svg+xml"
	case ".mp4":
		return "video/mp4"
	case ".mp3":
		return "audio/mpeg"
	case ".zip":
		return "application/zip"
	case ".docx":
		return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
	case ".xlsx":
		return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
	default:
		return "application/octet-stream"
	}
}

// ComputeHash computes the SHA256 hash of a file
func ComputeHash(path string) (string, error) {
	file, err := os.Open(path)
	if err != nil {
		return "", err
	}
	defer file.Close()

	hash := sha256.New()
	if _, err := io.Copy(hash, file); err != nil {
		return "", err
	}

	return fmt.Sprintf("%x", hash.Sum(nil)), nil
}

// DetectCreatedAt detects the creation date of a file
// On macOS, try to get the birthtime if available, otherwise fallback on mtime
// On Linux, use mtime (no reliable birthtime)
func DetectCreatedAt(path string) (time.Time, error) {
	stat, err := os.Stat(path)
	if err != nil {
		return time.Time{}, err
	}

	// On macOS, try to get the birthtime
	if runtime.GOOS == "darwin" {
		if sys := stat.Sys(); sys != nil {
			if unixStat, ok := sys.(*syscall.Stat_t); ok {
				// Use reflection to safely access Birthtimespec (only available on Darwin)
				birthtimeVal := reflect.ValueOf(unixStat).Elem().FieldByName("Birthtimespec")
				if birthtimeVal.IsValid() {
					sec := birthtimeVal.FieldByName("Sec").Int()
					nsec := birthtimeVal.FieldByName("Nsec").Int()
					birthtime := time.Unix(sec, nsec)
					if !birthtime.IsZero() && birthtime.Before(stat.ModTime()) {
						return birthtime, nil
					}
				}
			}
		}
	}

	// Fallback on ModTime
	return stat.ModTime(), nil
}

// ValidatePath validates that a path is secure (no path traversal)
func ValidatePath(basePath, requestedPath string) error {
	// Resolve the absolute paths
	absBase, err := filepath.Abs(basePath)
	if err != nil {
		return err
	}

	absRequested, err := filepath.Abs(requestedPath)
	if err != nil {
		return err
	}

	// Verify that the requested path is under the base path
	rel, err := filepath.Rel(absBase, absRequested)
	if err != nil {
		return err
	}

	if strings.HasPrefix(rel, "..") || strings.Contains(rel, string(filepath.Separator)+"..") {
		return fmt.Errorf("unauthorized path: %s", requestedPath)
	}

	return nil
}

// IsHiddenFile checks if a file is hidden (starts with .)
func IsHiddenFile(name string) bool {
	return strings.HasPrefix(name, ".")
}

// ShouldSkipDirectory checks if a directory should be ignored during the scan
func ShouldSkipDirectory(name string) bool {
	skipDirs := []string{
		"data",
		"thumbs",
		".git",
		"node_modules",
		"vendor",
		"tmp",
		"temp",
		"cache",
	}

	for _, skip := range skipDirs {
		if name == skip {
			return true
		}
	}

	return IsHiddenFile(name)
}

// GetFileExtension returns the extension of a file in lowercase
func GetFileExtension(filename string) string {
	return strings.ToLower(filepath.Ext(filename))
}

// FormatFileSize formats a file size in a human-readable format
func FormatFileSize(size int64) string {
	const unit = 1024
	if size < unit {
		return fmt.Sprintf("%d B", size)
	}
	div, exp := int64(unit), 0
	for n := size / unit; n >= unit; n /= unit {
		div *= unit
		exp++
	}
	return fmt.Sprintf("%.1f %cB", float64(size)/float64(div), "KMGTPE"[exp])
}

// IsImageFile checks if a file is an image
func IsImageFile(mime string) bool {
	return strings.HasPrefix(mime, "image/")
}

// IsPDFFile checks if a file is a PDF
func IsPDFFile(mime string) bool {
	return mime == "application/pdf"
}

// IsTextFile checks if a file is a text file
func IsTextFile(mime string) bool {
	return strings.HasPrefix(mime, "text/") || mime == "text/markdown"
}

// IsPreviewableFile checks if a file can be previewed
func IsPreviewableFile(mime string) bool {
	return IsImageFile(mime) || IsPDFFile(mime) || IsTextFile(mime)
}

// EnsureDir creates a directory if it doesn't exist
func EnsureDir(path string) error {
	return os.MkdirAll(path, 0755)
}
