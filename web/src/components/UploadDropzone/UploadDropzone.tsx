import React, { useState, useCallback, useRef } from 'react'
import { FileUpload, UploadProgress } from '@/types'
import { uploadFiles, ApiError } from '@/lib/api'
import { isAllowedFileType, generateId, formatFileSize } from '@/lib/utils'
import {
  DropzoneContainer,
  DropzoneArea,
  HiddenInput,
  DropzoneContent,
  DropzoneIcon,
  DropzoneTitle,
  DropzoneText,
  DropzoneButton,
  DropzoneInfo,
  InfoText,
  ProgressContainer,
  ProgressHeader,
  ProgressTitle,
  GlobalProgress,
  ProgressBar,
  ProgressFill,
  ProgressText,
  FilesList,
  FileItem,
  FileStatusIcon,
  FileInfo,
  FileName,
  FileSize,
  FileError,
  FileProgress,
  CancelButton,
} from './styled'

interface UploadDropzoneProps {
  allowedExtensions: string[]
  maxFileSize?: number
  onUploadComplete?: (uploadedFileIds: string[]) => void
  onUploadError?: (error: string) => void
  className?: string
}

export const UploadDropzone: React.FC<UploadDropzoneProps> = ({
  allowedExtensions,
  maxFileSize = 100,
  onUploadComplete,
  onUploadError,
  className = '',
}) => {
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploads, setUploads] = useState<FileUpload[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    handleFiles(files)
  }, [allowedExtensions, maxFileSize])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    handleFiles(files)
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [allowedExtensions, maxFileSize])

  const handleFiles = useCallback((files: File[]) => {
    const validFiles: File[] = []
    const errors: string[] = []

    files.forEach(file => {
      if (!isAllowedFileType(file, allowedExtensions)) {
        errors.push(`${file.name}: Type de fichier non autorisé`)
        return
      }

      const fileSizeMB = file.size / (1024 * 1024)
      if (fileSizeMB > maxFileSize) {
        errors.push(`${file.name}: Fichier trop volumineux (max ${maxFileSize}MB)`)
        return
      }

      validFiles.push(file)
    })

    if (errors.length > 0) {
      onUploadError?.(errors.join('\n'))
    }

    if (validFiles.length > 0) {
      startUpload(validFiles)
    }
  }, [allowedExtensions, maxFileSize, onUploadError])

  const startUpload = useCallback(async (files: File[]) => {
    setIsUploading(true)

    const newUploads: FileUpload[] = files.map(file => ({
      file,
      id: generateId(),
      progress: { loaded: 0, total: file.size, percentage: 0 },
      status: 'pending',
    }))

    setUploads(newUploads)

    try {
      const result = await uploadFiles(files, (progress) => {
        const totalLoaded = progress.loaded
        const totalSize = progress.total
        const percentage = Math.round((totalLoaded / totalSize) * 100)

        setUploads(current => 
          current.map(upload => ({
            ...upload,
            status: 'uploading',
            progress: {
              loaded: Math.round((totalLoaded / files.length)),
              total: Math.round((totalSize / files.length)),
              percentage: percentage,
            }
          }))
        )
      })

      setUploads(current => 
        current.map(upload => ({
          ...upload,
          status: 'completed',
          progress: { ...upload.progress, percentage: 100 }
        }))
      )

      onUploadComplete?.(result.uploaded)

      setTimeout(() => {
        setUploads([])
      }, 3000)

    } catch (error) {
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'Erreur lors de l\'upload'
      
      setUploads(current => 
        current.map(upload => ({
          ...upload,
          status: 'error',
          error: errorMessage
        }))
      )

      onUploadError?.(errorMessage)
    } finally {
      setIsUploading(false)
    }
  }, [onUploadComplete, onUploadError])

  const openFileSelector = () => {
    fileInputRef.current?.click()
  }

  const cancelUpload = (uploadId: string) => {
    setUploads(current => 
      current.filter(upload => upload.id !== uploadId)
    )
  }

  const hasActiveUploads = uploads.length > 0
  const totalProgress = uploads.reduce((acc, upload) => acc + upload.progress.percentage, 0) / uploads.length

  return (
    <DropzoneContainer className={className}>
      <DropzoneArea
        $isDragOver={isDragOver}
        $hasActiveUploads={hasActiveUploads}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <HiddenInput
          ref={fileInputRef}
          type="file"
          multiple
          accept={allowedExtensions.join(',')}
          onChange={handleFileSelect}
        />

        {!hasActiveUploads ? (
          <DropzoneContent>
            <DropzoneIcon>
              <svg width="64" height="64" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </DropzoneIcon>

            <DropzoneTitle>
              {isDragOver ? 'Déposez vos fichiers ici' : 'Glissez-déposez vos fichiers'}
            </DropzoneTitle>
            
            <DropzoneText>
              ou{' '}
              <DropzoneButton onClick={openFileSelector}>
                sélectionnez-les
              </DropzoneButton>
            </DropzoneText>

            <DropzoneInfo>
              <InfoText>
                <strong>Types acceptés:</strong> {allowedExtensions.join(', ')}
              </InfoText>
              <InfoText>
                <strong>Taille maximum:</strong> {maxFileSize}MB par fichier
              </InfoText>
            </DropzoneInfo>
          </DropzoneContent>
        ) : (
          <ProgressContainer>
            <ProgressHeader>
              <ProgressTitle>Upload en cours...</ProgressTitle>
              <GlobalProgress>
                <ProgressBar>
                  <ProgressFill $percentage={totalProgress} />
                </ProgressBar>
                <ProgressText>{Math.round(totalProgress)}% terminé</ProgressText>
              </GlobalProgress>
            </ProgressHeader>

            <FilesList>
              {uploads.map(upload => (
                <FileItem key={upload.id}>
                  <FileStatusIcon $status={upload.status}>
                    {upload.status === 'completed' && (
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {upload.status === 'error' && (
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                    {(upload.status === 'pending' || upload.status === 'uploading') && (
                      <div className="animate-spin">
                        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <circle cx="12" cy="12" r="10" strokeWidth={2} />
                        </svg>
                      </div>
                    )}
                  </FileStatusIcon>

                  <FileInfo>
                    <FileName>{upload.file.name}</FileName>
                    <FileSize>{formatFileSize(upload.file.size)}</FileSize>
                    {upload.error && (
                      <FileError>{upload.error}</FileError>
                    )}
                  </FileInfo>

                  {(upload.status === 'uploading' || upload.status === 'pending') && (
                    <FileProgress>
                      {upload.progress.percentage}%
                    </FileProgress>
                  )}

                  {upload.status !== 'completed' && (
                    <CancelButton
                      onClick={() => cancelUpload(upload.id)}
                      title="Annuler"
                    >
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </CancelButton>
                  )}
                </FileItem>
              ))}
            </FilesList>
          </ProgressContainer>
        )}
      </DropzoneArea>
    </DropzoneContainer>
  )
}

export default UploadDropzone
