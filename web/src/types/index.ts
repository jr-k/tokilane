// Types pour les fichiers
export interface FileItem {
  id: string
  name: string
  ext: string
  mime: string
  size: number
  size_formatted: string
  created_at: string
  has_preview: boolean
  has_thumbnail: boolean
  thumb_url?: string
  abs_path?: string
  hash?: string
  added_at?: string
}

// Types pour les filtres
export interface FileFilters {
  query?: string
  extension?: string
  date_from?: string
  date_to?: string
  min_size?: number
  max_size?: number
  page?: number
  page_size?: number
}

// Types pour les réponses API
export interface FileListResponse {
  items: FileItem[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface GroupedFiles {
  [date: string]: FileItem[]
}

// Types pour l'upload
export interface UploadResponse {
  uploaded: string[]
  count: number
  errors?: string[]
}

// Types pour les props des pages Inertia
export interface TimelinePageProps {
  timeline: GroupedFiles
  filters: FileFilters
  total: number
  enableUpload: boolean
  allowedExt: string[]
}

// Types pour les événements d'upload
export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

export interface FileUpload {
  file: File
  id: string
  progress: UploadProgress
  status: 'pending' | 'uploading' | 'completed' | 'error'
  error?: string
}

// Types pour la prévisualisation
export interface PreviewFile {
  id: string
  name: string
  ext: string
  mime: string
  size: number
  size_formatted: string
  created_at: string
  abs_path: string
  hash: string
  has_thumbnail: boolean
  thumb_url?: string
}

// Utilitaires de type
export type FileType = 'image' | 'pdf' | 'text' | 'video' | 'audio' | 'document' | 'archive' | 'other'

// Extensions par type
export const FILE_TYPE_EXTENSIONS: Record<FileType, string[]> = {
  image: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
  pdf: ['.pdf'],
  text: ['.txt', '.md'],
  video: ['.mp4', '.avi', '.mov', '.mkv'],
  audio: ['.mp3', '.wav', '.flac', '.aac'],
  document: ['.docx', '.xlsx', '.pptx', '.doc', '.xls', '.ppt'],
  archive: ['.zip', '.rar', '.7z', '.tar', '.gz'],
  other: [],
}

// Icônes par type de fichier
export const FILE_TYPE_ICONS: Record<FileType, string> = {
  image: '🖼️',
  pdf: '📄',
  text: '📝',
  video: '🎬',
  audio: '🎵',
  document: '📊',
  archive: '📦',
  other: '📁',
}
