import React, { useState, useEffect, useCallback } from 'react'
import { FileItem, FileFilters } from '@/types'
import { formatDate, formatDateTime, getFileIconByMime, formatFileSize, isDirectory } from '@/lib/utils'
import { useTranslation } from '@/lib/translations'
import Header from '@/components/Header/Header'
import { ViewMode } from '@/components/ViewSwitcher/ViewSwitcher'
import styled from 'styled-components'

// Styled Components modernes
const AppContainer = styled.div`
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  background: #0a0a0a;
  color: white;
  overflow: hidden;
  position: fixed;
  top: 0;
  left: 0;
`

const MainContent = styled.div`
  flex: 1;
  display: flex;
  min-height: 0;
  overflow: hidden;
`

const ContentArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
`

const PreviewArea = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #111111;
  position: relative;
  min-height: 0;
`

const PreviewContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
`

const PreviewContent = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #111111;
  min-height: 0;
`

const PreviewImage = styled.img`
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 8px;
`

const PreviewText = styled.div`
  padding: 40px;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
  font-size: 14px;
  line-height: 1.6;
  color: #e5e5e5;
  background: #1a1a1a;
  border-radius: 12px;
  max-width: 80%;
  max-height: 80%;
  overflow-y: auto;
  border: 1px solid rgba(255, 255, 255, 0.1);
`

const PreviewIframe = styled.iframe`
  width: 90%;
  height: 80%;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: white;
`

const PreviewVideo = styled.video`
  max-width: 90%;
  max-height: 80%;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`

const EmptyPreview = styled.div`
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
`

const EmptyPreviewIcon = styled.div`
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.3;
`

const EmptyPreviewTitle = styled.h3`
  font-size: 20px;
  font-weight: 500;
  margin-bottom: 8px;
  color: rgba(255, 255, 255, 0.8);
`

const EmptyPreviewText = styled.p`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
`

const FileInfoOverlay = styled.div`
  position: absolute;
  top: 24px;
  left: 24px;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(20px);
  padding: 16px 20px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  max-width: 400px;
`

const FileName = styled.div`
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 4px;
  color: white;
`

const FileDetails = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.4;
`

// Timeline moderne style YouTube/Netflix
const TimelineContainer = styled.div`
  height: 80px;
  background: rgba(10, 10, 10, 0.95);
  backdrop-filter: blur(20px);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding: 16px 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const TimelineHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const TimelineTitle = styled.div`
  font-size: 12px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
`

const TimelineStats = styled.div`
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
`

const ResolutionControls = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`

const ResolutionButton = styled.button<{ $active: boolean }>`
  background: ${props => props.$active ? 'linear-gradient(45deg, #ff0050, #ff4081)' : 'rgba(255, 255, 255, 0.1)'};
  color: ${props => props.$active ? 'white' : 'rgba(255, 255, 255, 0.7)'};
  border: 1px solid ${props => props.$active ? 'transparent' : 'rgba(255, 255, 255, 0.2)'};
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 10px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.$active ? 'linear-gradient(45deg, #ff0050, #ff4081)' : 'rgba(255, 255, 255, 0.2)'};
  }
`

const SeekbarContainer = styled.div`
  position: relative;
  height: 6px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 3px;
  cursor: pointer;
  flex: 1;
`

const SeekbarTrack = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  width: 100%;
`

const SeekbarProgress = styled.div<{ progress: number }>`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: linear-gradient(90deg, #ff0050, #ff4081);
  border-radius: 3px;
  width: ${props => props.progress}%;
  transition: width 0.3s ease;
`

const FileMarkers = styled.div`
  position: absolute;
  top: -4px;
  left: 0;
  right: 0;
  height: 14px;
  display: flex;
  align-items: center;
`

const FileMarker = styled.div<{ 
  $position: number
  $isSelected: boolean 
  $isHovered: boolean 
}>`
  position: absolute;
  left: ${props => props.$position}%;
  width: ${props => props.$isSelected ? '14px' : props.$isHovered ? '12px' : '8px'};
  height: ${props => props.$isSelected ? '14px' : props.$isHovered ? '12px' : '8px'};
  background: ${props => props.$isSelected 
    ? 'linear-gradient(45deg, #ff0050, #ff4081)'
    : props.$isHovered 
      ? 'rgba(255, 255, 255, 0.9)'
      : 'rgba(255, 255, 255, 0.6)'
  };
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
  transform: translate(-50%, 0);
  border: 2px solid ${props => props.$isSelected ? '#ffffff' : 'transparent'};
  box-shadow: ${props => props.$isSelected ? '0 0 0 2px rgba(255, 0, 80, 0.3)' : 'none'};

  &:hover {
    transform: translate(-50%, 0) scale(1.2);
  }
`

const FileTooltip = styled.div<{ $visible: boolean, $position: number }>`
  position: absolute;
  bottom: 24px;
  left: ${props => props.$position}%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(10px);
  color: white;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 12px;
  white-space: nowrap;
  opacity: ${props => props.$visible ? 1 : 0};
  visibility: ${props => props.$visible ? 'visible' : 'hidden'};
  transition: all 0.2s ease;
  border: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 1000;
`

const LoadingSpinner = styled.div`
  width: 32px;
  height: 32px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-top: 2px solid #ff4081;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`

const DownloadButton = styled.button`
  background: linear-gradient(45deg, #ff0050, #ff4081);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 16px;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 24px rgba(255, 0, 80, 0.3);
  }
`

// Side panel
const SidePanel = styled.div`
  width: 320px;
  background: rgba(15, 15, 15, 0.95);
  backdrop-filter: blur(20px);
  border-left: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  overflow: hidden;
`

const SidePanelHeader = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(20, 20, 20, 0.5);
`

const SidePanelTitle = styled.h3`
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
`

const SidePanelContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 12px 0;

  /* Masquer scrollbar mais garder fonctionnalité */
  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar {
    display: none;
  }
`

const FileListItem = styled.div<{ $isCurrentFile: boolean, $isPast: boolean }>`
  padding: 12px 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-left: 3px solid transparent;
  opacity: ${props => props.$isCurrentFile ? 1 : props.$isPast ? 0.4 : 0.6};
  
  ${props => props.$isCurrentFile && `
    background: rgba(255, 0, 80, 0.1);
    border-left-color: #ff0050;
  `}

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    opacity: ${props => props.$isCurrentFile ? 1 : 0.8};
  }
`

const FileItemName = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: white;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
`

const FileItemIcon = styled.span`
  font-size: 16px;
  opacity: 0.8;
`

const FileItemDetails = styled.div`
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.3;
`

const FileItemDate = styled.div`
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 2px;
`

// Badge pour les dates multiples
const DateBadge = styled.div`
  position: absolute;
  top: -6px;
  right: -6px;
  background: linear-gradient(45deg, #ff0050, #ff4081);
  color: white;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
  border: 2px solid #0a0a0a;
  box-shadow: 0 2px 8px rgba(255, 0, 80, 0.3);
`

interface TimelineData {
  timeline: { [date: string]: FileItem[] }
  filters: FileFilters
  total: number
  enableUpload: boolean
  allowedExt: string[]
}

type TimeResolution = 'second' | 'minute' | 'hour' | 'day' | 'month'

interface TimelineSeekbarProps {
  viewMode?: ViewMode
  onViewModeChange?: (mode: ViewMode) => void
}

const TimelineSeekbar: React.FC<TimelineSeekbarProps> = ({ 
  viewMode = 'seekbar',
  onViewModeChange 
}) => {
  const { t } = useTranslation()
  const [timelineData, setTimelineData] = useState<TimelineData | null>(null)
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [previewContent, setPreviewContent] = useState<string | null>(null)
  const [hoveredFileIndex, setHoveredFileIndex] = useState<number | null>(null)
  const [timeResolution, setTimeResolution] = useState<TimeResolution>('day')
  const loadingRef = React.useRef(false)
  const sidePanelContentRef = React.useRef<HTMLDivElement>(null)

  // Helper function to convert newlines to HTML breaks
  const nl2br = (text: string) => {
    return text.split('\n').map((line, index, array) => (
      <React.Fragment key={index}>
        {line}
        {index < array.length - 1 && <br />}
      </React.Fragment>
    ))
  }

  // Function to load data
  const loadTimelineData = useCallback(async () => {
    if (loadingRef.current) return
    
    try {
      loadingRef.current = true
      setIsLoading(true)
      
      const response = await fetch('/api/timeline?page=1&page_size=100')
      if (!response.ok) throw new Error('Loading error')
      
      const data = await response.json()
      setTimelineData(data)
      
      // Automatically select the first file
      const allFiles = getAllFilesFromData(data)
      if (allFiles.length > 0) {
        setSelectedFile(allFiles[0])
        setSelectedIndex(0)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
      loadingRef.current = false
    }
  }, [])

  // Utilitaire pour extraire tous les fichiers (exclut les dossiers)
  const getAllFilesFromData = (data: TimelineData): FileItem[] => {
    if (!data?.timeline) return []
    
    const allFiles: FileItem[] = []
    const dates = Object.keys(data.timeline).sort()
    
    for (const date of dates) {
      // Filtrer les dossiers
      const filesOnly = data.timeline[date].filter(file => !isDirectory(file))
      allFiles.push(...filesOnly)
    }
    
    return allFiles.sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
  }

  // Utilitaire pour obtenir les fichiers avec des dates valides (exclut les dates par défaut comme 0001-01-01)
  const getFilesWithValidDates = (files: FileItem[]): FileItem[] => {
    return files.filter(file => {
      const date = new Date(file.created_at)
      // Exclure les dates antérieures à 1970 (epoch Unix) qui sont probablement des valeurs par défaut
      return date.getFullYear() >= 1970
    })
  }

  // Charger le contenu textuel d'un fichier
  const loadTextContent = useCallback(async (file: FileItem) => {
    if (!file || (!file.mime?.startsWith('text/') && file.ext !== '.md')) return
    
    try {
      const response = await fetch(`/files/${file.id}/preview`)
      if (response.ok) {
        const content = await response.text()
        setPreviewContent(content)
      }
    } catch (error) {
      console.error('Error loading content:', error)
    }
  }, [])

  // Effect to load data on mount
  useEffect(() => {
    loadTimelineData()
  }, []) // Removed loadTimelineData from dependencies to prevent infinite loop

  // Effet pour charger le contenu quand le fichier sélectionné change
  useEffect(() => {
    if (selectedFile) {
      setPreviewContent(null)
      loadTextContent(selectedFile)
    }
  }, [selectedFile, loadTextContent])

  // Obtenir tous les fichiers
  const allFiles = timelineData ? getAllFilesFromData(timelineData) : []

  // Fonction pour scroll automatiquement vers l'élément sélectionné
  const scrollToSelectedFile = useCallback((index: number) => {
    if (sidePanelContentRef.current && allFiles.length > 0) {
      // Trouver l'élément correspondant à l'index
      const fileItems = sidePanelContentRef.current.children
      const targetElement = fileItems[index] as HTMLElement
      
      if (targetElement) {
        // Utiliser scrollIntoView pour un scroll précis
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        })
      }
    }
  }, [allFiles.length])

  // Gestion de la sélection d'un fichier
  const handleFileSelect = useCallback((file: FileItem, index: number) => {
    setSelectedFile(file)
    setSelectedIndex(index)
    // Scroll automatique vers l'élément sélectionné
    setTimeout(() => scrollToSelectedFile(index), 100)
  }, [scrollToSelectedFile])

  // Navigation au clavier
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (allFiles.length === 0) return

      switch (event.key) {
        case 'ArrowLeft':
        case 'ArrowUp':
          event.preventDefault()
          if (selectedIndex > 0) {
            handleFileSelect(allFiles[selectedIndex - 1], selectedIndex - 1)
          }
          break
        case 'ArrowRight':
        case 'ArrowDown':
          event.preventDefault()
          if (selectedIndex < allFiles.length - 1) {
            handleFileSelect(allFiles[selectedIndex + 1], selectedIndex + 1)
          }
          break
        case 'Home':
          event.preventDefault()
          handleFileSelect(allFiles[0], 0)
          break
        case 'End':
          event.preventDefault()
          handleFileSelect(allFiles[allFiles.length - 1], allFiles.length - 1)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [allFiles, selectedIndex, handleFileSelect])

  // Grouper les fichiers par date pour les badges
  const getFilesByDate = useCallback(() => {
    const filesByDate: { [date: string]: FileItem[] } = {}
    const validFiles = getFilesWithValidDates(allFiles)
    validFiles.forEach(file => {
      const date = file.created_at.split('T')[0] // YYYY-MM-DD
      if (!filesByDate[date]) {
        filesByDate[date] = []
      }
      filesByDate[date].push(file)
    })
    return filesByDate
  }, [allFiles])

  const filesByDate = getFilesByDate()

  // Fonctions pour la timeline temporelle
  const getTimeRange = useCallback(() => {
    const validFiles = getFilesWithValidDates(allFiles)
    if (validFiles.length === 0) return { start: new Date(), end: new Date() }
    
    const dates = validFiles.map(f => new Date(f.created_at))
    return {
      start: new Date(Math.min(...dates.map(d => d.getTime()))),
      end: new Date(Math.max(...dates.map(d => d.getTime())))
    }
  }, [allFiles])

  const generateTimeMarkers = useCallback(() => {
    const { start, end } = getTimeRange()
    const markers: Date[] = []
    
    const current = new Date(start)
    let iterations = 0
    const maxIterations = 10000 // Prevent infinite loops
    
    switch (timeResolution) {
      case 'second':
        while (current <= end && iterations < maxIterations) {
          markers.push(new Date(current))
          current.setSeconds(current.getSeconds() + 1)
          iterations++
        }
        break
      case 'minute':
        current.setSeconds(0)
        while (current <= end && iterations < maxIterations) {
          markers.push(new Date(current))
          current.setMinutes(current.getMinutes() + 1)
          iterations++
        }
        break
      case 'hour':
        current.setMinutes(0, 0)
        while (current <= end && iterations < maxIterations) {
          markers.push(new Date(current))
          current.setHours(current.getHours() + 1)
          iterations++
        }
        break
      case 'day':
        current.setHours(0, 0, 0, 0)
        while (current <= end && iterations < maxIterations) {
          markers.push(new Date(current))
          current.setDate(current.getDate() + 1)
          iterations++
        }
        break
      case 'month':
        current.setDate(1)
        current.setHours(0, 0, 0, 0)
        while (current <= end && iterations < maxIterations) {
          markers.push(new Date(current))
          current.setMonth(current.getMonth() + 1)
          iterations++
        }
        break
    }
    
    if (iterations >= maxIterations) {
      console.warn('TimelineSeekbar: generateTimeMarkers hit max iterations limit')
    }
    
    return markers
  }, [getTimeRange, timeResolution])

  const getPositionFromTime = useCallback((time: Date) => {
    const { start, end } = getTimeRange()
    const totalDuration = end.getTime() - start.getTime()
    const position = (time.getTime() - start.getTime()) / totalDuration
    return Math.max(0, Math.min(100, position * 100))
  }, [getTimeRange])

  // Rendu du preview
  const renderPreview = () => {
    if (!selectedFile) {
      return (
        <EmptyPreview>
          <EmptyPreviewIcon>📁</EmptyPreviewIcon>
          <EmptyPreviewTitle>{t('seekbar.noFileSelected')}</EmptyPreviewTitle>
          <EmptyPreviewText>{t('seekbar.clickTimelineToStart')}</EmptyPreviewText>
        </EmptyPreview>
      )
    }

    const { mime, ext } = selectedFile

    // Image
    if (mime?.startsWith('image/')) {
      return (
        <PreviewImage
          src={`/files/${selectedFile.id}/preview`}
          alt={selectedFile.name}
          onError={() => console.error(t('seekbar.errorLoadingImage'))}
        />
      )
    }

    // PDF
    if (mime === 'application/pdf' || ext === '.pdf') {
      return (
        <PreviewIframe
          src={`/files/${selectedFile.id}/preview`}
          title={selectedFile.name}
        />
      )
    }

    // Vidéo
    if (mime?.startsWith('video/') || ['.mp4', '.webm', '.ogg', '.avi', '.mov'].includes(ext)) {
      return (
        <PreviewVideo
          src={`/files/${selectedFile.id}/preview`}
          controls
          autoPlay={false}
        >
          {t('seekbar.browserVideoNotSupported')}
        </PreviewVideo>
      )
    }

    // Texte
    if (mime?.startsWith('text/') || ext === '.md' || ext === '.txt') {
      return (
        <PreviewText>
          {previewContent ? nl2br(previewContent) : t('seekbar.loadingContent')}
        </PreviewText>
      )
    }

    // Autres types
    return (
      <EmptyPreview>
        <EmptyPreviewIcon>{getFileIconByMime(selectedFile.mime)}</EmptyPreviewIcon>
        <EmptyPreviewTitle>{selectedFile.name}</EmptyPreviewTitle>
        <EmptyPreviewText>{t('seekbar.previewNotAvailable')}</EmptyPreviewText>
        {!isDirectory(selectedFile) && (
          <DownloadButton 
            onClick={() => window.open(`/files/${selectedFile.id}/preview`, '_blank')}
          >
            {t('seekbar.downloadFile')}
          </DownloadButton>
        )}
      </EmptyPreview>
    )
  }

  if (isLoading) {
    return (
      <AppContainer>
        <PreviewArea>
          <LoadingSpinner />
        </PreviewArea>
      </AppContainer>
    )
  }

  const progress = allFiles.length > 0 ? ((selectedIndex + 1) / allFiles.length) * 100 : 0

  return (
    <AppContainer>
      <Header 
        title="Tokilane" 
        totalFiles={timelineData?.total || 0}
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
      />

      <MainContent>
        <ContentArea>
          <PreviewArea>
            <PreviewContainer>
              <PreviewContent>
                {renderPreview()}
              </PreviewContent>
              
              {selectedFile && (
                <FileInfoOverlay>
                  <FileName>{selectedFile.name}</FileName>
                  <FileDetails>
                    {formatDateTime(selectedFile.created_at)} • {formatFileSize(selectedFile.size)}<br/>
                    {selectedFile.mime}
                  </FileDetails>
                </FileInfoOverlay>
              )}
            </PreviewContainer>
          </PreviewArea>

          <TimelineContainer>
            <TimelineHeader>
              <TimelineTitle>
                {selectedIndex + 1} / {allFiles.length}
              </TimelineTitle>
              <ResolutionControls>
                {(['second', 'minute', 'hour', 'day', 'month'] as TimeResolution[]).map(resolution => (
                  <ResolutionButton
                    key={resolution}
                    $active={timeResolution === resolution}
                    onClick={() => setTimeResolution(resolution)}
                  >
                    {resolution === 'second' ? t('time.sec') : 
                     resolution === 'minute' ? t('time.min') : 
                     resolution === 'hour' ? t('time.h') : 
                     resolution === 'day' ? t('time.d') : t('time.m')}
                  </ResolutionButton>
                ))}
              </ResolutionControls>
              {(() => {
                const validFiles = getFilesWithValidDates(allFiles)
                return validFiles.length > 0 && (
                  <TimelineStats>
                    {validFiles.length === 1 
                      ? formatDate(validFiles[0].created_at)
                      : `${formatDate(validFiles[0].created_at)} → ${formatDate(validFiles[validFiles.length - 1].created_at)}`
                    }
                  </TimelineStats>
                )
              })()}
            </TimelineHeader>
            
            <SeekbarContainer>
              <SeekbarTrack />
              <SeekbarProgress progress={progress} />
              
              {/* Marqueurs temporels */}
              <FileMarkers>
                {generateTimeMarkers().map((timeMarker, index) => (
                  <div
                    key={index}
                    style={{
                      position: 'absolute',
                      left: `${getPositionFromTime(timeMarker)}%`,
                      top: '-2px',
                      width: '1px',
                      height: '10px',
                      background: 'rgba(255, 255, 255, 0.3)',
                      transform: 'translateX(-50%)'
                    }}
                  />
                ))}
                
                {/* Fichiers positionnés par temps */}
                {allFiles.filter(file => {
                  const date = new Date(file.created_at)
                  return date.getFullYear() >= 1970
                }).map((file) => {
                  // Trouver l'index original du fichier dans allFiles
                  const index = allFiles.findIndex(f => f.id === file.id)
                  const fileTime = new Date(file.created_at)
                  const position = getPositionFromTime(fileTime)
                  const isSelected = selectedIndex === index
                  const isHovered = hoveredFileIndex === index
                  const fileDate = file.created_at.split('T')[0]
                  const filesOnSameDate = filesByDate[fileDate]?.length || 1
                  
                  return (
                    <React.Fragment key={file.id}>
                      <FileMarker
                        $position={position}
                        $isSelected={isSelected}
                        $isHovered={isHovered}
                        onClick={() => handleFileSelect(file, index)}
                        onMouseEnter={() => setHoveredFileIndex(index)}
                        onMouseLeave={() => setHoveredFileIndex(null)}
                        style={{ position: 'relative' }}
                      >
                        {filesOnSameDate > 1 && (
                          <DateBadge>{filesOnSameDate}</DateBadge>
                        )}
                      </FileMarker>
                      
                      <FileTooltip
                        $visible={isHovered}
                        $position={position}
                      >
                        {file.name}<br/>
                        {formatDateTime(file.created_at)}
                        {filesOnSameDate > 1 && ` (${filesOnSameDate} ${t('time.filesThisDay')})`}
                      </FileTooltip>
                    </React.Fragment>
                  )
                })}
              </FileMarkers>
            </SeekbarContainer>
          </TimelineContainer>
        </ContentArea>

        <SidePanel>
          <SidePanelHeader>
            <SidePanelTitle>{t('seekbar.files')}</SidePanelTitle>
          </SidePanelHeader>
          <SidePanelContent ref={sidePanelContentRef}>
            {allFiles.map((file, index) => {
              const isCurrentFile = selectedIndex === index
              const isPast = index < selectedIndex
              
              return (
                <FileListItem
                  key={file.id}
                  $isCurrentFile={isCurrentFile}
                  $isPast={isPast}
                  onClick={() => handleFileSelect(file, index)}
                >
                  <FileItemName>
                    <FileItemIcon>{getFileIconByMime(file.mime)}</FileItemIcon>
                    {file.name}
                  </FileItemName>
                  <FileItemDetails>
                    {formatFileSize(file.size)} • {file.mime}
                  </FileItemDetails>
                  <FileItemDate>
                    {formatDateTime(file.created_at)}
                  </FileItemDate>
                </FileListItem>
              )
            })}
          </SidePanelContent>
        </SidePanel>
      </MainContent>
    </AppContainer>
  )
}

export default TimelineSeekbar
