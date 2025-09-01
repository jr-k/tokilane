import React, { useState, useEffect, useCallback } from 'react'
import { FileItem, FileFilters } from '@/types'
import { buildQueryString, parseQueryString } from '@/lib/utils'
import Header from '@/components/Header/Header'
import FiltersBar from '@/components/FiltersBar/FiltersBar'
import FileGroup from '@/components/FileGroup/FileGroup'
import PreviewPanel from '@/components/PreviewPanel/PreviewPanel'
import UploadDropzone from '@/components/UploadDropzone/UploadDropzone'
import { ViewMode } from '@/components/ViewSwitcher/ViewSwitcher'
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

interface TimelineData {
  timeline: { [date: string]: FileItem[] }
  filters: FileFilters
  total: number
  enableUpload: boolean
  allowedExt: string[]
}

interface TimelineStandaloneProps {
  viewMode?: ViewMode
  onViewModeChange?: (mode: ViewMode) => void
}

const TimelineStandalone: React.FC<TimelineStandaloneProps> = ({ 
  viewMode = 'explorer',
  onViewModeChange 
}) => {
  const [timelineData, setTimelineData] = useState<TimelineData | null>(null)
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null)
  const [filters, setFilters] = useState<FileFilters>({})
  const [isLoading, setIsLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const loadingRef = React.useRef(false) // Protection contre les appels multiples

  // Charger les données de la timeline
  const loadTimelineData = useCallback(async (newFilters: FileFilters = {}) => {
    // console.log('=== loadTimelineData START ===')
    // console.log('loadingRef.current:', loadingRef.current)
    // console.log('newFilters:', newFilters)
    
    // Protection contre les appels multiples
    if (loadingRef.current) {
      // console.log('Already loading, skipping')
      return
    }
    
    try {
      loadingRef.current = true
      setIsLoading(true)
      const queryString = buildQueryString(newFilters)
      // console.log('queryString:', queryString)
      
      const apiUrl = `/api/timeline${queryString}`
      // console.log('Making API call to:', apiUrl)
      
      const response = await fetch(apiUrl)
      // console.log('API response status:', response.status)
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des données')
      }
      
      const data = await response.json()
      // console.log('API response data:', data)
      // console.log('Total files returned by API:', data.total)
      // console.log('Timeline dates:', Object.keys(data.timeline || {}))
      setTimelineData(data)
      setFilters(newFilters)
      // console.log('Timeline data updated successfully')
    } catch (error) {
      console.error('Erreur dans loadTimelineData:', error)
    } finally {
      setIsLoading(false)
      loadingRef.current = false
      // console.log('=== loadTimelineData END ===')
    }
  }, [])

  // Charger les données au montage
  useEffect(() => {
    const params = parseQueryString(window.location.search)
    const initialFilters: FileFilters = {
      query: params.q || '',
      extension: params.ext || '',
      date_from: params.date_from || undefined,
      date_to: params.date_to || undefined,
      min_size: params.min_size ? parseInt(params.min_size) : undefined,
      max_size: params.max_size ? parseInt(params.max_size) : undefined,
      page: params.page ? parseInt(params.page) : 1,
      page_size: params.page_size ? parseInt(params.page_size) : 50,
    }

    loadTimelineData(initialFilters)
  }, [])

  // Gestion des changements de filtres
  const handleFiltersChange = useCallback((newFilters: FileFilters) => {
    // console.log('handleFiltersChange called with:', newFilters)
    setFilters(currentFilters => {
      // console.log('Current filters:', currentFilters)
      
      // Vérifier si les filtres ont vraiment changé (en excluant la page)
      const { page: oldPage, ...oldFiltersWithoutPage } = currentFilters
      const { page: newPage, ...newFiltersWithoutPage } = newFilters
      
      const filtersChanged = JSON.stringify(oldFiltersWithoutPage) !== JSON.stringify(newFiltersWithoutPage)
      // console.log('Filters changed?', filtersChanged)
      
      if (!filtersChanged) {
        // console.log('No changes detected, skipping update')
        return currentFilters // Pas de changement
      }
      
      const queryString = buildQueryString(newFilters)
      // console.log('Query string:', queryString)
      
      // Mettre à jour l'URL
      const newUrl = `${window.location.pathname}${queryString}`
      window.history.pushState({}, '', newUrl)
      
      // Charger les nouvelles données
      // console.log('Calling loadTimelineData with:', newFilters)
      loadTimelineData(newFilters)
      
      return newFilters
    })
  }, [loadTimelineData])

  // Gestion de l'ouverture d'un fichier
  const handleFileClick = (file: FileItem) => {
    setSelectedFile(file)
  }

  // Fermer l'aperçu
  const closePreview = () => {
    setSelectedFile(null)
  }

  // Trier les dates pour l'affichage
  const sortedDates = timelineData ? Object.keys(timelineData.timeline).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  ) : []

  // Obtenir tous les fichiers dans l'ordre chronologique
  const getAllFiles = useCallback((): FileItem[] => {
    if (!timelineData) return []
    
    const allFiles: FileItem[] = []
    sortedDates.forEach(date => {
      allFiles.push(...timelineData.timeline[date])
    })
    return allFiles
  }, [timelineData, sortedDates])

  // Navigation vers le fichier précédent
  const handlePrevious = useCallback(() => {
    if (!selectedFile) return
    
    const allFiles = getAllFiles()
    const currentIndex = allFiles.findIndex(file => file.id === selectedFile.id)
    if (currentIndex > 0) {
      setSelectedFile(allFiles[currentIndex - 1])
    }
  }, [selectedFile, getAllFiles])

  // Navigation vers le fichier suivant
  const handleNext = useCallback(() => {
    if (!selectedFile) return
    
    const allFiles = getAllFiles()
    const currentIndex = allFiles.findIndex(file => file.id === selectedFile.id)
    if (currentIndex < allFiles.length - 1) {
      setSelectedFile(allFiles[currentIndex + 1])
    }
  }, [selectedFile, getAllFiles])

  // Gestion de l'upload
  const handleUploadComplete = useCallback((uploadedFileIds: string[]) => {
    // console.log('Files uploaded:', uploadedFileIds)
    setShowUpload(false)
    // Recharger les données
    setTimeout(() => {
      loadTimelineData(filters)
    }, 1000)
  }, [filters, loadTimelineData])

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

  if (!timelineData) {
    return (
      <PageContainer>
        <LoadingIndicator>
          <LoadingSpinner />
          <LoadingText>Chargement...</LoadingText>
        </LoadingIndicator>
      </PageContainer>
    )
  }



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
        totalFiles={timelineData.total}
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
      />
      
      <FiltersBar
        filters={filters}
        onFiltersChange={handleFiltersChange}
        allowedExtensions={timelineData.allowedExt}
        totalFiles={timelineData.total}
      />

      {/* Bouton d'upload flottant */}
      {timelineData.enableUpload && !showUpload && (
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
          <EmptyState 
            hasFilters={hasFilters} 
            enableUpload={timelineData.enableUpload} 
            onShowUpload={() => setShowUpload(true)}
            onClearFilters={() => handleFiltersChange({})}
          />
        ) : (
          <div style={{ paddingTop: '1.5rem' }}>
            {sortedDates.map((date) => (
              <FileGroup
                key={date}
                date={date}
                files={timelineData.timeline[date]}
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
          onPrevious={handlePrevious}
          onNext={handleNext}
        />
      )}

      {/* Interface d'upload */}
      {showUpload && timelineData.enableUpload && (
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
                allowedExtensions={timelineData.allowedExt}
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
const EmptyState: React.FC<{ 
  hasFilters: boolean
  enableUpload: boolean
  onShowUpload: () => void
  onClearFilters: () => void
}> = ({ 
  hasFilters, 
  enableUpload,
  onShowUpload,
  onClearFilters
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
            <PrimaryButton onClick={onClearFilters}>
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

export default TimelineStandalone
