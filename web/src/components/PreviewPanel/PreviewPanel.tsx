import React, { useState, useEffect } from 'react'
import { FileItem } from '@/types'
import { useTranslation } from '@/lib/translations'
import { 
  getPreviewUrl, 
  getDownloadUrl, 
  copyToClipboard, 
  formatDateTime, 
  isImageFile, 
  isPdfFile, 
  isTextFile,
  getFileIconByMime,
  isDirectory
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
  const { t } = useTranslation()
  const [detailedFile, setDetailedFile] = useState<FileItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [imageZoom, setImageZoom] = useState(1)
  const [textContent, setTextContent] = useState<string | null>(null)
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [scrollStart, setScrollStart] = useState({ x: 0, y: 0 })

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
        setError(t('preview.loadingError'))
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

  // Handlers for image pan/drag
  const handleMouseDown = (event: React.MouseEvent) => {
    if (imageZoom > 1) {
      setIsPanning(true)
      setPanStart({ x: event.clientX, y: event.clientY })
      const container = event.currentTarget as HTMLDivElement
      setScrollStart({ x: container.scrollLeft, y: container.scrollTop })
      event.preventDefault()
    }
  }

  const handleMouseMove = (event: React.MouseEvent) => {
    if (isPanning && imageZoom > 1) {
      const container = event.currentTarget as HTMLDivElement
      const deltaX = event.clientX - panStart.x
      const deltaY = event.clientY - panStart.y
      
      container.scrollLeft = scrollStart.x - deltaX
      container.scrollTop = scrollStart.y - deltaY
      event.preventDefault()
    }
  }

  const handleMouseUp = () => {
    setIsPanning(false)
  }

  const handleMouseLeave = () => {
    setIsPanning(false)
  }

  const handleDownload = () => {
    if (detailedFile) {
      window.open(getDownloadUrl(detailedFile.id), '_blank')
    }
  }

  const handleCopyPath = async () => {
    if (detailedFile?.abs_path) {
      const success = await copyToClipboard(detailedFile.abs_path)
      if (success) {
        // console.log('Path copied:', detailedFile.abs_path)
      }
    }
  }

  const handleOpenInFolder = () => {
    if (detailedFile?.abs_path) {
      alert(`${t('preview.fileLocationMessage')}\n${detailedFile.abs_path}`)
    }
  }

  if (loading) {
    return (
      <ModalOverlay>
        <LoadingContainer>
          <LoadingSpinner />
          <LoadingText>{t('preview.loading')}</LoadingText>
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
          <ErrorTitle>{t('preview.loadingError')}</ErrorTitle>
          <ErrorText>{error || t('preview.errorOccurred')}</ErrorText>
          <CloseButton onClick={onClose}>{t('preview.close')}</CloseButton>
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
              <FileIcon>{getFileIconByMime(detailedFile.mime)}</FileIcon>
              <FileDetails>
                <FileName title={detailedFile.name}>{detailedFile.name}</FileName>
                <FileMetadata>
                  {detailedFile.size_formatted} • {formatDateTime(detailedFile.created_at)}
                </FileMetadata>
              </FileDetails>
            </FileInfo>

            <ActionsContainer>
              {onPrevious && (
                <ActionButton onClick={onPrevious} title={t('preview.previousFile')}>
                  <ActionIcon>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </ActionIcon>
                </ActionButton>
              )}
              
              {onNext && (
                <ActionButton onClick={onNext} title={t('preview.nextFile')}>
                  <ActionIcon>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </ActionIcon>
                </ActionButton>
              )}

              {!isDirectory(file) && (
                <ActionButton onClick={handleDownload} title={t('preview.download')}>
                  <ActionIcon>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </ActionIcon>
                </ActionButton>
              )}

              <ActionButton onClick={handleCopyPath} title={t('preview.copyPath')}>
                <ActionIcon>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </ActionIcon>
              </ActionButton>

              <ActionButton onClick={handleOpenInFolder} title={t('preview.openInFolder')}>
                <ActionIcon>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                </ActionIcon>
              </ActionButton>

              <ActionButton onClick={onClose} title={t('preview.closeEsc')}>
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
              <ImagePreviewContainer
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                style={{
                  cursor: imageZoom > 1 ? (isPanning ? 'grabbing' : 'grab') : 'default'
                }}
              >
                <ZoomControls>
                  <ZoomButton
                    onClick={() => setImageZoom(Math.max(0.1, imageZoom - 0.1))}
                    title={t('preview.zoomOut')}
                  >
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </ZoomButton>
                  
                  <ZoomLevel>{Math.round(imageZoom * 100)}%</ZoomLevel>
                  
                  <ZoomButton
                    onClick={() => setImageZoom(imageZoom + 0.1)}
                    title={t('preview.zoomIn')}
                  >
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </ZoomButton>
                  
                  <ZoomButton onClick={() => setImageZoom(1)} title={t('preview.actualSize')}>
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
                {textContent || t('preview.unableToLoadTextContent')}
              </TextPreview>
            )}
            
            {!detailedFile.has_preview && (
              <UnsupportedContainer>
                <UnsupportedIcon>{getFileIconByMime(detailedFile.mime)}</UnsupportedIcon>
                <UnsupportedTitle>{t('preview.previewNotSupportedTitle')}</UnsupportedTitle>
                <UnsupportedText>
                  {t('preview.previewNotSupportedText')}
                </UnsupportedText>
                {!isDirectory(detailedFile) && (
                  <DownloadButton onClick={handleDownload}>
                    {t('preview.downloadFile')}
                  </DownloadButton>
                )}
              </UnsupportedContainer>
            )}
          </PreviewContainer>
        </ModalContent>

        <ModalFooter>
          <MetadataGrid>
            <MetadataItem>
              <MetadataLabel>{t('preview.mimeType')}</MetadataLabel>
              <MetadataValue>{detailedFile.mime}</MetadataValue>
            </MetadataItem>
            <MetadataItem>
              <MetadataLabel>{t('preview.size')}</MetadataLabel>
              <MetadataValue>{detailedFile.size_formatted}</MetadataValue>
            </MetadataItem>
            <MetadataItem>
              <MetadataLabel>{t('preview.createdOn')}</MetadataLabel>
              <MetadataValue>{formatDateTime(detailedFile.created_at)}</MetadataValue>
            </MetadataItem>
            <MetadataItem>
              <MetadataLabel>{t('preview.hash')}</MetadataLabel>
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
