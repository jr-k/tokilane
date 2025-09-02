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

// FileSignature represents a file type signature
type FileSignature struct {
	MimeType string
	Offset   int
	Signature []byte
}

// Common file signatures (magic numbers)
var fileSignatures = []FileSignature{
	// Images
	{MimeType: "image/jpeg", Offset: 0, Signature: []byte{0xFF, 0xD8, 0xFF}},
	{MimeType: "image/png", Offset: 0, Signature: []byte{0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A}},
	{MimeType: "image/gif", Offset: 0, Signature: []byte{0x47, 0x49, 0x46, 0x38, 0x37, 0x61}}, // GIF87a
	{MimeType: "image/gif", Offset: 0, Signature: []byte{0x47, 0x49, 0x46, 0x38, 0x39, 0x61}}, // GIF89a
	{MimeType: "image/webp", Offset: 8, Signature: []byte{0x57, 0x45, 0x42, 0x50}}, // WEBP at offset 8
	{MimeType: "image/bmp", Offset: 0, Signature: []byte{0x42, 0x4D}}, // BM
	{MimeType: "image/tiff", Offset: 0, Signature: []byte{0x49, 0x49, 0x2A, 0x00}}, // Little endian TIFF
	{MimeType: "image/tiff", Offset: 0, Signature: []byte{0x4D, 0x4D, 0x00, 0x2A}}, // Big endian TIFF
	
	// Documents
	{MimeType: "application/pdf", Offset: 0, Signature: []byte{0x25, 0x50, 0x44, 0x46}}, // %PDF
	
	// Archives
	{MimeType: "application/zip", Offset: 0, Signature: []byte{0x50, 0x4B, 0x03, 0x04}}, // PK..
	{MimeType: "application/zip", Offset: 0, Signature: []byte{0x50, 0x4B, 0x05, 0x06}}, // PK.. (empty archive)
	{MimeType: "application/zip", Offset: 0, Signature: []byte{0x50, 0x4B, 0x07, 0x08}}, // PK.. (spanned archive)
	{MimeType: "application/x-rar-compressed", Offset: 0, Signature: []byte{0x52, 0x61, 0x72, 0x21, 0x1A, 0x07, 0x00}}, // Rar!...
	{MimeType: "application/x-rar-compressed", Offset: 0, Signature: []byte{0x52, 0x61, 0x72, 0x21, 0x1A, 0x07, 0x01, 0x00}}, // Rar!....
	{MimeType: "application/x-7z-compressed", Offset: 0, Signature: []byte{0x37, 0x7A, 0xBC, 0xAF, 0x27, 0x1C}}, // 7z
	{MimeType: "application/gzip", Offset: 0, Signature: []byte{0x1F, 0x8B}}, // .gz
	
	// Videos
	{MimeType: "video/mp4", Offset: 4, Signature: []byte{0x66, 0x74, 0x79, 0x70}}, // ftyp
	{MimeType: "video/avi", Offset: 0, Signature: []byte{0x52, 0x49, 0x46, 0x46}}, // RIFF
	{MimeType: "video/quicktime", Offset: 4, Signature: []byte{0x6D, 0x6F, 0x6F, 0x76}}, // moov
	{MimeType: "video/x-msvideo", Offset: 8, Signature: []byte{0x41, 0x56, 0x49, 0x20}}, // AVI 
	
	// Audio
	{MimeType: "audio/mpeg", Offset: 0, Signature: []byte{0xFF, 0xFB}}, // MP3
	{MimeType: "audio/mpeg", Offset: 0, Signature: []byte{0x49, 0x44, 0x33}}, // ID3 (MP3 with ID3 tag)
	{MimeType: "audio/wav", Offset: 0, Signature: []byte{0x52, 0x49, 0x46, 0x46}}, // RIFF (WAV)
	{MimeType: "audio/flac", Offset: 0, Signature: []byte{0x66, 0x4C, 0x61, 0x43}}, // fLaC
	{MimeType: "audio/ogg", Offset: 0, Signature: []byte{0x4F, 0x67, 0x67, 0x53}}, // OggS
	
	// Office documents (ZIP-based)
	{MimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", Offset: 0, Signature: []byte{0x50, 0x4B}}, // DOCX (ZIP)
	{MimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", Offset: 0, Signature: []byte{0x50, 0x4B}}, // XLSX (ZIP)
	{MimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation", Offset: 0, Signature: []byte{0x50, 0x4B}}, // PPTX (ZIP)
	
	// Legacy Office documents
	{MimeType: "application/msword", Offset: 0, Signature: []byte{0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1}}, // DOC
	{MimeType: "application/vnd.ms-excel", Offset: 0, Signature: []byte{0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1}}, // XLS
	{MimeType: "application/vnd.ms-powerpoint", Offset: 0, Signature: []byte{0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1}}, // PPT
}

// detectMimeByContent analyzes file content to determine MIME type
func detectMimeByContent(path string) string {
	file, err := os.Open(path)
	if err != nil {
		return ""
	}
	defer file.Close()
	
	// Read first 512 bytes (enough for most signatures)
	buffer := make([]byte, 512)
	n, err := file.Read(buffer)
	if err != nil && err != io.EOF {
		return ""
	}
	
	// Check each signature
	for _, sig := range fileSignatures {
		if n > sig.Offset+len(sig.Signature) {
			match := true
			for i, b := range sig.Signature {
				if buffer[sig.Offset+i] != b {
					match = false
					break
				}
			}
			if match {
				// Special handling for Office documents that are ZIP-based
				if sig.MimeType == "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
				   sig.MimeType == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
				   sig.MimeType == "application/vnd.openxmlformats-officedocument.presentationml.presentation" {
					// Check file extension to distinguish between DOCX, XLSX, PPTX
					ext := strings.ToLower(filepath.Ext(path))
					switch ext {
					case ".docx":
						return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
					case ".xlsx":
						return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
					case ".pptx":
						return "application/vnd.openxmlformats-officedocument.presentationml.presentation"
					default:
						return "application/zip" // Generic ZIP if extension doesn't match
					}
				}
				
				// Special handling for RIFF files (AVI vs WAV)
				if sig.MimeType == "video/avi" && len(buffer) > 8 {
					// Check for AVI signature at offset 8
					if buffer[8] == 0x41 && buffer[9] == 0x56 && buffer[10] == 0x49 && buffer[11] == 0x20 {
						return "video/x-msvideo"
					}
					// Check for WAVE signature at offset 8
					if buffer[8] == 0x57 && buffer[9] == 0x41 && buffer[10] == 0x56 && buffer[11] == 0x45 {
						return "audio/wav"
					}
				}
				
				return sig.MimeType
			}
		}
	}
	
	// Check for text files by analyzing content
	if isTextContent(buffer[:n]) {
		// Check for specific text formats
		content := string(buffer[:n])
		if strings.HasPrefix(content, "<?xml") {
			return "application/xml"
		}
		if strings.HasPrefix(content, "<html") || strings.HasPrefix(content, "<!DOCTYPE html") {
			return "text/html"
		}
		if strings.Contains(content, "# ") || strings.Contains(content, "## ") {
			return "text/markdown"
		}
		return "text/plain"
	}
	
	return ""
}

// isTextContent checks if the content appears to be text
func isTextContent(data []byte) bool {
	if len(data) == 0 {
		return true
	}
	
	// Count non-printable characters
	nonPrintable := 0
	for _, b := range data {
		// Allow common whitespace characters
		if b == '\t' || b == '\n' || b == '\r' {
			continue
		}
		// Check for printable ASCII and common UTF-8 ranges
		if b < 32 || (b > 126 && b < 160) {
			nonPrintable++
		}
	}
	
	// If less than 5% non-printable characters, consider it text
	return float64(nonPrintable)/float64(len(data)) < 0.05
}

// DetectMime detects the MIME type of a file
func DetectMime(path string) string {
	// First, try to detect by file content
	if contentMime := detectMimeByContent(path); contentMime != "" {
		return contentMime
	}
	
	// Fallback to extension-based detection
	ext := strings.ToLower(filepath.Ext(path))
	mimeType := mime.TypeByExtension(ext)
	
	if mimeType != "" {
		return mimeType
	}
	
	// Fallback for some common types not in standard library
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

// ComputeHash computes a fast hash based on file metadata and partial content
func ComputeHash(path string) (string, error) {
	stat, err := os.Stat(path)
	if err != nil {
		return "", err
	}

	// Create hash from metadata (size, mod time, path)
	hash := sha256.New()
	
	// Write file metadata to hash
	hash.Write([]byte(path))
	hash.Write([]byte(fmt.Sprintf("%d", stat.Size())))
	hash.Write([]byte(fmt.Sprintf("%d", stat.ModTime().UnixNano())))
	
	// For small files (< 1MB), hash the entire content
	// For larger files, hash only the first and last 64KB
	if stat.Size() <= 1024*1024 {
		file, err := os.Open(path)
		if err != nil {
			return "", err
		}
		defer file.Close()
		
		if _, err := io.Copy(hash, file); err != nil {
			return "", err
		}
	} else {
		// Hash first 64KB and last 64KB for large files
		file, err := os.Open(path)
		if err != nil {
			return "", err
		}
		defer file.Close()
		
		// Read first 64KB
		buffer := make([]byte, 65536) // 64KB
		n, err := file.Read(buffer)
		if err != nil && err != io.EOF {
			return "", err
		}
		hash.Write(buffer[:n])
		
		// Read last 64KB if file is large enough
		if stat.Size() > 131072 { // > 128KB
			_, err = file.Seek(-65536, io.SeekEnd) // Seek to 64KB before end
			if err != nil {
				return "", err
			}
			n, err = file.Read(buffer)
			if err != nil && err != io.EOF {
				return "", err
			}
			hash.Write(buffer[:n])
		}
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
