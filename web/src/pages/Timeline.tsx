import React, { useState, useEffect } from 'react'
import { TimelinePageProps, FileItem, FileFilters } from '@/types'
import { parseQueryString } from '@/lib/utils'
import Header from '@/components/Header/Header'
import FiltersBar from '@/components/FiltersBar/FiltersBar'
import FileGroup from '@/components/FileGroup/FileGroup'
import PreviewPanel from '@/components/PreviewPanel/PreviewPanel'
import UploadDropzone from '@/components/UploadDropzone/UploadDropzone'
import {
  PageContainer,
  MainContent,
  LoadingIndicator,
  LoadingSpinner,
  LoadingText,
  FloatingUploadButton,
  UploadModal,
  UploadModalContent,
  UploadModalHeader,
  UploadModalTitle,
  UploadModalCloseButton,
  UploadModalBody,
  EmptyStateContainer,
  EmptyStateContent,
  EmptyStateIcon,
  EmptyStateTitle,
  EmptyStateText,
  EmptyStateActions,
  PrimaryButton,
  SecondaryButton,
} from './styled'

// Le composant principal de la page Timeline
const Timeline: React.FC<TimelinePageProps> = ({ 
  timeline, 
  filters: initialFilters, 
  total, 
  enableUpload, 
  allowedExt 
}) => {
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null)
  const [filters, setFilters] = useState<FileFilters>(initialFilters)
  const [isLoading, setIsLoading] = useState(false)
  const [showUpload, setShowUpload] = useState(false)

  // Synchroniser l'URL avec les filtres
  useEffect(() => {
    const params = parseQueryString(window.location.search)
    const urlFilters: FileFilters = {
      query: params.q || '',
      extension: params.ext || '',
      date_from: params.date_from || undefined,
      date_to: params.date_to || undefined,
      min_size: params.min_size ? parseInt(params.min_size) : undefined,
      max_size: params.max_size ? parseInt(params.max_size) : undefined,
      page: params.page ? parseInt(params.page) : 1,
      page_size: params.page_size ? parseInt(params.page_size) : 50,
    }

    setFilters(urlFilters)
  }, [])

  // Gérer les changements de filtres
  const handleFiltersChange = (newFilters: FileFilters) => {
    setFilters(newFilters)
    setIsLoading(true)

    // Construire la nouvelle URL
    // const queryString = buildQueryString({
    //   q: newFilters.query,
    //   ext: newFilters.extension,
    //   date_from: newFilters.date_from,
    //   date_to: newFilters.date_to,
    //   min_size: newFilters.min_size,
    //   max_size: newFilters.max_size,
    //   page: newFilters.page,
    //   page_size: newFilters.page_size,
    // })

    // Note: In a real implementation, this would update the URL
    // For now, we'll just update the loading state
    setIsLoading(false)
  }

  // Gérer l'ouverture d'un fichier
  const handleFileClick = (file: FileItem) => {
    setSelectedFile(file)
  }

  // Fermer l'aperçu
  const closePreview = () => {
    setSelectedFile(null)
  }

  // Gestion de l'upload
  const handleUploadComplete = (_uploadedFileIds: string[]) => {
    // console.log('Files uploaded:', _uploadedFileIds)
    setShowUpload(false)
    // Rafraîchir la page pour voir les nouveaux fichiers
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  }

  const handleUploadError = (error: string) => {
    console.error('Upload error:', error)
    alert('Erreur lors de l\'upload: ' + error)
  }

  // Gestion des raccourcis clavier
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && selectedFile) {
        closePreview()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectedFile])

  // Trier les dates pour l'affichage
  const sortedDates = Object.keys(timeline).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  )

  // État vide
  const isEmpty = sortedDates.length === 0
  const hasFilters = !!(
    filters.query ||
    filters.extension ||
    filters.date_from ||
    filters.date_to ||
    filters.min_size ||
    filters.max_size
  )

  return (
    <PageContainer>
      <Header 
        title="Tokilane" 
        totalFiles={total}
      />
      
      <FiltersBar
        filters={filters}
        onFiltersChange={handleFiltersChange}
        allowedExtensions={allowedExt}
        totalFiles={total}
      />

      {/* Bouton d'upload flottant */}
      {enableUpload && !showUpload && (
        <FloatingUploadButton
          onClick={() => setShowUpload(true)}
          title="Uploader des fichiers"
        >
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </FloatingUploadButton>
      )}

      <MainContent>
        {/* Indicateur de chargement */}
        {isLoading && (
          <LoadingIndicator>
            <LoadingSpinner />
            <LoadingText>Chargement...</LoadingText>
          </LoadingIndicator>
        )}

        {/* Contenu principal */}
        {isEmpty ? (
          <EmptyState hasFilters={hasFilters} enableUpload={enableUpload} onShowUpload={() => setShowUpload(true)} />
        ) : (
          <div style={{ paddingTop: '1.5rem' }}>
            {sortedDates.map((date) => (
              <FileGroup
                key={date}
                date={date}
                files={timeline[date]}
                onFileClick={handleFileClick}
              />
            ))}
          </div>
        )}
      </MainContent>

      {/* Aperçu de fichier */}
      {selectedFile && (
        <PreviewPanel
          file={selectedFile}
          onClose={closePreview}
          onPrevious={() => {
            // TODO: Implémenter la navigation entre fichiers
            // console.log('Navigation vers le fichier précédent')
          }}
          onNext={() => {
            // TODO: Implémenter la navigation entre fichiers
            // console.log('Navigation vers le fichier suivant')
          }}
        />
      )}

      {/* Interface d'upload */}
      {showUpload && enableUpload && (
        <UploadModal>
          <UploadModalContent>
            <UploadModalHeader>
              <UploadModalTitle>
                Uploader des fichiers
              </UploadModalTitle>
              <UploadModalCloseButton onClick={() => setShowUpload(false)}>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </UploadModalCloseButton>
            </UploadModalHeader>
            <UploadModalBody>
              <UploadDropzone
                allowedExtensions={allowedExt}
                maxFileSize={100}
                onUploadComplete={handleUploadComplete}
                onUploadError={handleUploadError}
              />
            </UploadModalBody>
          </UploadModalContent>
        </UploadModal>
      )}
    </PageContainer>
  )
}

// Composant pour l'état vide
const EmptyState: React.FC<{ hasFilters: boolean; enableUpload: boolean; onShowUpload: () => void }> = ({ 
  hasFilters, 
  enableUpload,
  onShowUpload 
}) => {
  return (
    <EmptyStateContainer>
      <EmptyStateContent>
        <EmptyStateIcon>
          <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </EmptyStateIcon>
        
        <EmptyStateTitle>
          {hasFilters ? 'Aucun fichier trouvé' : 'Aucun fichier indexé'}
        </EmptyStateTitle>
        
        <EmptyStateText>
          {hasFilters 
            ? 'Essayez de modifier vos filtres de recherche ou d\'effacer tous les filtres.'
            : 'Ajoutez des fichiers dans le dossier surveillé ou utilisez la fonction d\'upload.'
          }
        </EmptyStateText>

        <EmptyStateActions>
          {hasFilters && (
            <PrimaryButton onClick={() => window.location.href = '/'}>
              Effacer tous les filtres
            </PrimaryButton>
          )}
          
          {enableUpload && (
            <SecondaryButton onClick={onShowUpload}>
              Uploader des fichiers
            </SecondaryButton>
          )}
        </EmptyStateActions>
      </EmptyStateContent>
    </EmptyStateContainer>
  )
}

export default Timeline
