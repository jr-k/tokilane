import React, { useState, useEffect } from 'react'
import { FileItem } from '@/types'
import { 
  getPreviewUrl, 
  getDownloadUrl, 
  copyToClipboard, 
  formatDateTime, 
  isImageFile, 
  isPdfFile, 
  isTextFile,
  getFileIcon
} from '@/lib/utils'
import { getFile } from '@/lib/api'
import {
  ModalOverlay,
  ModalContainer,
  ModalHeader,
  HeaderContent,
  FileInfo,
  FileIcon,
  FileDetails,
  FileName,
  FileMetadata,
  ActionsContainer,
  ActionButton,
  ActionIcon,
  ModalContent,
  PreviewContainer,
  ImagePreviewContainer,
  ZoomControls,
  ZoomButton,
  ZoomLevel,
  PreviewImage,
  PDFEmbed,
  TextPreview,
  UnsupportedContainer,
  UnsupportedIcon,
  UnsupportedTitle,
  UnsupportedText,
  DownloadButton,
  LoadingContainer,
  LoadingSpinner,
  LoadingText,
  ErrorContainer,
  ErrorIcon,
  ErrorTitle,
  ErrorText,
  CloseButton,
  ModalFooter,
  MetadataGrid,
  MetadataItem,
  MetadataLabel,
  MetadataValue,
} from './styled'

interface PreviewPanelProps {
  file: FileItem
  onClose: () => void
  onPrevious?: () => void
  onNext?: () => void
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({
  file,
  onClose,
  onPrevious,
  onNext,
}) => {
  const [detailedFile, setDetailedFile] = useState<FileItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [imageZoom, setImageZoom] = useState(1)
  const [textContent, setTextContent] = useState<string | null>(null)

  useEffect(() => {
    const loadFileDetails = async () => {
      try {
        setLoading(true)
        setError(null)
        const details = await getFile(file.id)
        setDetailedFile(details)
        
        if (isTextFile(details.mime)) {
          await loadTextContent(details.id)
        }
      } catch (err) {
        setError('Erreur lors du chargement des détails du fichier')
        console.error('Error loading file details:', err)
      } finally {
        setLoading(false)
      }
    }

    loadFileDetails()
  }, [file.id])

  const loadTextContent = async (fileId: string) => {
    try {
      const response = await fetch(getPreviewUrl(fileId))
      if (response.ok) {
        const content = await response.text()
        setTextContent(content)
      }
    } catch (err) {
      console.error('Error loading text content:', err)
    }
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      } else if (event.key === 'ArrowLeft' && onPrevious) {
        onPrevious()
      } else if (event.key === 'ArrowRight' && onNext) {
        onNext()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose, onPrevious, onNext])

  const handleDownload = () => {
    if (detailedFile) {
      window.open(getDownloadUrl(detailedFile.id), '_blank')
    }
  }

  const handleCopyPath = async () => {
    if (detailedFile?.abs_path) {
      const success = await copyToClipboard(detailedFile.abs_path)
      if (success) {
        console.log('Chemin copié:', detailedFile.abs_path)
      }
    }
  }

  const handleOpenInFolder = () => {
    if (detailedFile?.abs_path) {
      alert(`Fichier situé dans :\n${detailedFile.abs_path}`)
    }
  }

  if (loading) {
    return (
      <ModalOverlay>
        <LoadingContainer>
          <LoadingSpinner />
          <LoadingText>Chargement...</LoadingText>
          <CloseButton onClick={onClose}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </CloseButton>
        </LoadingContainer>
      </ModalOverlay>
    )
  }

  if (error || !detailedFile) {
    return (
      <ModalOverlay>
        <ErrorContainer>
          <ErrorIcon>
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </ErrorIcon>
          <ErrorTitle>Erreur de chargement</ErrorTitle>
          <ErrorText>{error || 'Une erreur est survenue lors du chargement du fichier.'}</ErrorText>
          <CloseButton onClick={onClose}>Fermer</CloseButton>
        </ErrorContainer>
      </ModalOverlay>
    )
  }

  return (
    <ModalOverlay>
      <ModalContainer>
        <ModalHeader>
          <HeaderContent>
            <FileInfo>
              <FileIcon>{getFileIcon(detailedFile.ext)}</FileIcon>
              <FileDetails>
                <FileName title={detailedFile.name}>{detailedFile.name}</FileName>
                <FileMetadata>
                  {detailedFile.size_formatted} • {formatDateTime(detailedFile.created_at)}
                </FileMetadata>
              </FileDetails>
            </FileInfo>

            <ActionsContainer>
              {onPrevious && (
                <ActionButton onClick={onPrevious} title="Fichier précédent">
                  <ActionIcon>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </ActionIcon>
                </ActionButton>
              )}
              
              {onNext && (
                <ActionButton onClick={onNext} title="Fichier suivant">
                  <ActionIcon>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </ActionIcon>
                </ActionButton>
              )}

              <ActionButton onClick={handleDownload} title="Télécharger">
                <ActionIcon>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </ActionIcon>
              </ActionButton>

              <ActionButton onClick={handleCopyPath} title="Copier le chemin">
                <ActionIcon>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </ActionIcon>
              </ActionButton>

              <ActionButton onClick={handleOpenInFolder} title="Ouvrir dans le dossier">
                <ActionIcon>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                </ActionIcon>
              </ActionButton>

              <ActionButton onClick={onClose} title="Fermer (Échap)">
                <ActionIcon>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </ActionIcon>
              </ActionButton>
            </ActionsContainer>
          </HeaderContent>
        </ModalHeader>

        <ModalContent>
          <PreviewContainer>
            {isImageFile(detailedFile.mime) && (
              <ImagePreviewContainer>
                <ZoomControls>
                  <ZoomButton
                    onClick={() => setImageZoom(Math.max(0.1, imageZoom - 0.1))}
                    title="Dézoomer"
                  >
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </ZoomButton>
                  
                  <ZoomLevel>{Math.round(imageZoom * 100)}%</ZoomLevel>
                  
                  <ZoomButton
                    onClick={() => setImageZoom(imageZoom + 0.1)}
                    title="Zoomer"
                  >
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </ZoomButton>
                  
                  <ZoomButton onClick={() => setImageZoom(1)} title="Taille réelle">
                    1:1
                  </ZoomButton>
                </ZoomControls>

                <PreviewImage
                  src={getPreviewUrl(detailedFile.id)}
                  alt={detailedFile.name}
                  $zoom={imageZoom}
                />
              </ImagePreviewContainer>
            )}
            
            {isPdfFile(detailedFile.mime) && (
              <PDFEmbed
                src={getPreviewUrl(detailedFile.id)}
                type="application/pdf"
              />
            )}
            
            {isTextFile(detailedFile.mime) && (
              <TextPreview>
                {textContent || 'Impossible de charger le contenu du fichier.'}
              </TextPreview>
            )}
            
            {!detailedFile.has_preview && (
              <UnsupportedContainer>
                <UnsupportedIcon>{getFileIcon(detailedFile.ext)}</UnsupportedIcon>
                <UnsupportedTitle>Aperçu non disponible</UnsupportedTitle>
                <UnsupportedText>
                  Ce type de fichier ({detailedFile.mime}) ne peut pas être prévisualisé directement.
                </UnsupportedText>
                <DownloadButton onClick={handleDownload}>
                  Télécharger le fichier
                </DownloadButton>
              </UnsupportedContainer>
            )}
          </PreviewContainer>
        </ModalContent>

        <ModalFooter>
          <MetadataGrid>
            <MetadataItem>
              <MetadataLabel>Type MIME:</MetadataLabel>
              <MetadataValue>{detailedFile.mime}</MetadataValue>
            </MetadataItem>
            <MetadataItem>
              <MetadataLabel>Taille:</MetadataLabel>
              <MetadataValue>{detailedFile.size_formatted}</MetadataValue>
            </MetadataItem>
            <MetadataItem>
              <MetadataLabel>Créé le:</MetadataLabel>
              <MetadataValue>{formatDateTime(detailedFile.created_at)}</MetadataValue>
            </MetadataItem>
            <MetadataItem>
              <MetadataLabel>Hash:</MetadataLabel>
              <MetadataValue title={detailedFile.hash}>
                {detailedFile.hash?.substring(0, 16)}...
              </MetadataValue>
            </MetadataItem>
          </MetadataGrid>
        </ModalFooter>
      </ModalContainer>
    </ModalOverlay>
  )
}

export default PreviewPanel
