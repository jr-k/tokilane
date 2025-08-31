import { FileFilters, FileListResponse, FileItem, UploadResponse } from '@/types'

// Configuration de base pour les appels API
const API_BASE = '/api'

// Classe d'erreur personnalisée pour les erreurs API
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// Fonction utilitaire pour faire des appels fetch avec gestion d'erreur
const apiFetch = async <T>(url: string, options: RequestInit = {}): Promise<T> => {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new ApiError(
      errorData.error || `Erreur HTTP ${response.status}`,
      response.status,
      errorData
    )
  }

  return response.json()
}

// API pour récupérer la liste des fichiers
export const getFiles = async (filters: FileFilters = {}): Promise<FileListResponse> => {
  const queryParams = new URLSearchParams()
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value))
    }
  })

  const url = `${API_BASE}/files${queryParams.toString() ? `?${queryParams}` : ''}`
  return apiFetch<FileListResponse>(url)
}

// API pour récupérer les détails d'un fichier
export const getFile = async (id: string): Promise<FileItem> => {
  return apiFetch<FileItem>(`${API_BASE}/files/${id}`)
}

// API pour uploader des fichiers
export const uploadFiles = async (
  files: File[],
  onProgress?: (progress: { loaded: number; total: number }) => void
): Promise<UploadResponse> => {
  const formData = new FormData()
  
  files.forEach(file => {
    formData.append('files', file)
  })

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    // Gestion du progrès
    if (onProgress) {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          onProgress({
            loaded: event.loaded,
            total: event.total,
          })
        }
      })
    }

    // Gestion de la réponse
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText)
          resolve(response)
        } catch (error) {
          reject(new ApiError('Réponse invalide du serveur', xhr.status))
        }
      } else {
        try {
          const errorData = JSON.parse(xhr.responseText)
          reject(new ApiError(errorData.error || `Erreur HTTP ${xhr.status}`, xhr.status, errorData))
        } catch {
          reject(new ApiError(`Erreur HTTP ${xhr.status}`, xhr.status))
        }
      }
    })

    // Gestion des erreurs
    xhr.addEventListener('error', () => {
      reject(new ApiError('Erreur réseau', 0))
    })

    xhr.addEventListener('abort', () => {
      reject(new ApiError('Upload annulé', 0))
    })

    // Envoyer la requête
    xhr.open('POST', `${API_BASE}/upload`)
    xhr.send(formData)
  })
}

// Fonction utilitaire pour télécharger un fichier
export const downloadFile = async (id: string, filename: string): Promise<void> => {
  try {
    const response = await fetch(`/files/${id}/preview?download=1`)
    
    if (!response.ok) {
      throw new ApiError(`Erreur lors du téléchargement: ${response.status}`, response.status)
    }

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    
    // Créer un lien temporaire pour télécharger
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    
    // Nettoyer
    window.URL.revokeObjectURL(url)
    document.body.removeChild(link)
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new ApiError('Erreur lors du téléchargement', 0)
  }
}

// Fonction pour vérifier l'état du serveur
export const healthCheck = async (): Promise<{
  status: string
  version: string
  upload: boolean
  files_root: string
  allowed_ext: string[]
}> => {
  // Note: Cette route n'est pas encore implémentée côté serveur
  // mais peut être ajoutée facilement
  return apiFetch('/api/health')
}

// Hook personnalisé pour gérer les erreurs API
export const handleApiError = (error: unknown): string => {
  if (error instanceof ApiError) {
    return error.message
  }
  
  if (error instanceof Error) {
    return error.message
  }
  
  return 'Une erreur inattendue s\'est produite'
}
