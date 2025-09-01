import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { FileType, FILE_TYPE_EXTENSIONS, FILE_TYPE_ICONS } from '@/types'

// Formatage des dates en français
export const formatDate = (dateString: string): string => {
  try {
    const date = parseISO(dateString)
    return format(date, 'dd MMMM yyyy', { locale: fr })
  } catch {
    return dateString
  }
}

export const formatDateTime = (dateString: string): string => {
  try {
    const date = parseISO(dateString)
    return format(date, 'dd/MM/yyyy à HH:mm', { locale: fr })
  } catch {
    return dateString
  }
}

export const formatTime = (dateString: string): string => {
  try {
    const date = parseISO(dateString)
    return format(date, 'HH:mm', { locale: fr })
  } catch {
    return dateString
  }
}

// Déterminer le type de fichier par extension
export const getFileType = (extension: string): FileType => {
  const ext = extension.toLowerCase()
  
  for (const [type, extensions] of Object.entries(FILE_TYPE_EXTENSIONS)) {
    if (extensions.includes(ext)) {
      return type as FileType
    }
  }
  
  return 'other'
}

// Obtenir l'icône d'un fichier
export const getFileIcon = (extension: string): string => {
  const type = getFileType(extension)
  return FILE_TYPE_ICONS[type]
}

// Vérifier si un fichier est prévisualisable
export const isPreviewableFile = (mime: string): boolean => {
  return (
    mime.startsWith('image/') ||
    mime === 'application/pdf' ||
    mime.startsWith('text/') ||
    mime === 'text/markdown'
  )
}

// Vérifier si un fichier est une image
export const isImageFile = (mime: string): boolean => {
  return mime.startsWith('image/')
}

// Vérifier si un fichier est un PDF
export const isPdfFile = (mime: string): boolean => {
  return mime === 'application/pdf'
}

// Vérifier si un fichier est un fichier texte
export const isTextFile = (mime: string): boolean => {
  return mime.startsWith('text/') || mime === 'text/markdown'
}

// Formatage des tailles de fichier
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

// Debounce pour les recherches
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: number
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Copier du texte dans le presse-papiers
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Fallback pour les navigateurs plus anciens
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    textArea.style.top = '-999999px'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    
    try {
      document.execCommand('copy')
      document.body.removeChild(textArea)
      return true
    } catch {
      document.body.removeChild(textArea)
      return false
    }
  }
}

// Générer une URL de téléchargement
export const getDownloadUrl = (fileId: string): string => {
  return `/files/${fileId}/preview?download=1`
}

// Générer une URL de prévisualisation
export const getPreviewUrl = (fileId: string): string => {
  return `/files/${fileId}/preview`
}

// Générer une URL de miniature
export const getThumbnailUrl = (fileId: string): string => {
  return `/files/${fileId}/thumb`
}

// Validation des types de fichiers pour l'upload
export const isAllowedFileType = (file: File, allowedExtensions: string[]): boolean => {
  const fileName = file.name.toLowerCase()
  return allowedExtensions.some(ext => fileName.endsWith(ext.toLowerCase()))
}

// Générer un ID unique
export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9)
}

// Trier les fichiers par date
export const sortFilesByDate = (files: any[], ascending = false): any[] => {
  return [...files].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime()
    const dateB = new Date(b.created_at).getTime()
    return ascending ? dateA - dateB : dateB - dateA
  })
}

// Grouper les fichiers par date
export const groupFilesByDate = (files: any[]): Record<string, any[]> => {
  return files.reduce((groups, file) => {
    const date = parseISO(file.created_at)
    const dateKey = format(date, 'yyyy-MM-dd')
    
    if (!groups[dateKey]) {
      groups[dateKey] = []
    }
    
    groups[dateKey].push(file)
    return groups
  }, {} as Record<string, any[]>)
}

// Construire une query string à partir d'un objet
export const buildQueryString = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams()
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value))
    }
  })
  
  const query = searchParams.toString()
  return query ? `?${query}` : ''
}

// Parser une query string en objet
export const parseQueryString = (search: string): Record<string, string> => {
  const params = new URLSearchParams(search)
  const result: Record<string, string> = {}
  
  for (const [key, value] of params.entries()) {
    result[key] = value
  }
  
  return result
}

// Classe conditionnelle (simple alternative à clsx)
export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ')
}
