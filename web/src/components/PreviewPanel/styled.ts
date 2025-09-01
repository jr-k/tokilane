import styled from 'styled-components'

export const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.75);
  z-index: ${({ theme }) => theme.zIndex[50]};
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing[4]};
`

export const ModalContainer = styled.div`
  background-color: rgba(20, 20, 20, 0.95);
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  max-width: 6xl;
  height: 95vh;
  width: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`

export const ModalHeader = styled.div`
  background-color: rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: ${({ theme }) => theme.spacing[4]};
`

export const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing[3]};
`

export const FileInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  flex: 1;
  min-width: 0;
`

export const FileIcon = styled.div`
  font-size: 2rem;
  flex-shrink: 0;
`

export const FileDetails = styled.div`
  min-width: 0;
  flex: 1;
`

export const FileName = styled.h2`
  font-size: 1.125rem;
  font-weight: 600;
  color: white;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

export const FileMetadata = styled.p`
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
`

export const ActionsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  flex-shrink: 0;
`

export const ActionButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  background-color: transparent;
  color: rgba(255, 255, 255, 0.7);
  border: 1px solid transparent;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.normal};

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
    color: white;
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(255, 0, 80, 0.5);
  }
`

export const ActionIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
`

export const ModalContent = styled.div`
  flex: 1;
  overflow: hidden;
`

export const PreviewContainer = styled.div`
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
`

export const ImagePreviewContainer = styled.div`
  height: 70vh;
  overflow: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing[4]};
  position: relative;
  cursor: grab;

  &:active {
    cursor: grabbing;
  }

  /* Améliore le scroll sur les appareils tactiles */
  -webkit-overflow-scrolling: touch;
  
  /* Style des scrollbars personnalisées pour cette vue */
  &::-webkit-scrollbar {
    width: 12px;
    height: 12px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 6px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.5);
  }
`

export const ZoomControls = styled.div`
  position: absolute;
  top: ${({ theme }) => theme.spacing[4]};
  right: ${({ theme }) => theme.spacing[4]};
  z-index: ${({ theme }) => theme.zIndex[10]};
  background-color: rgba(20, 20, 20, 0.9);
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: ${({ theme }) => theme.spacing[2]};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
`

export const ZoomButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  background-color: transparent;
  color: rgba(255, 255, 255, 0.8);
  border: 1px solid transparent;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.normal};

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
    color: white;
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(255, 0, 80, 0.5);
  }
`

export const ZoomLevel = styled.span`
  font-size: 0.875rem;
  font-weight: 500;
  color: white;
  min-width: 3rem;
  text-align: center;
`

export const PreviewImage = styled.img<{ $zoom: number }>`
  max-width: none;
  max-height: none;
  transform: scale(${({ $zoom }) => $zoom});
  transform-origin: center;
  transition: transform ${({ theme }) => theme.transitions.normal};
  display: block;
  
  /* Assurer que l'image peut déborder du conteneur quand zoomée */
  min-width: ${({ $zoom }) => $zoom > 1 ? 'auto' : '100%'};
  min-height: ${({ $zoom }) => $zoom > 1 ? 'auto' : '100%'};
  
  /* Éviter la sélection de l'image lors du glissement */
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  
  /* Améliorer le rendu des images */
  image-rendering: high-quality;
  image-rendering: -webkit-optimize-contrast;
`

export const PDFEmbed = styled.embed`
  width: 100%;
  height: 100%;
  border: none;
`

export const TextPreview = styled.pre`
  padding: ${({ theme }) => theme.spacing[6]};
  font-size: 0.875rem;
  font-family: ${({ theme }) => theme.fonts.mono};
  white-space: pre-wrap;
  overflow: auto;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.8);
  color: #e5e5e5;
  border-radius: 8px;
  margin: ${({ theme }) => theme.spacing[4]};
`

export const UnsupportedContainer = styled.div`
  height: 70vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing[8]};
`

export const UnsupportedIcon = styled.div`
  font-size: 4rem;
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`

export const UnsupportedTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: white;
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`

export const UnsupportedText = styled.p`
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: ${({ theme }) => theme.spacing[4]};
  line-height: 1.5;
`

export const DownloadButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[6]};
  font-size: 0.875rem;
  font-weight: 500;
  background: linear-gradient(45deg, #ff0050, #ff4081);
  color: white;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.normal};

  &:hover {
    background: linear-gradient(45deg, #ff0040, #ff3071);
    transform: translateY(-1px);
    box-shadow: 0 8px 24px rgba(255, 0, 80, 0.3);
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(255, 0, 80, 0.5);
  }
`

export const LoadingContainer = styled.div`
  background-color: rgba(20, 20, 20, 0.9);
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: ${({ theme }) => theme.spacing[8]};
  text-align: center;
  position: relative;
`

export const LoadingSpinner = styled.div`
  width: 2rem;
  height: 2rem;
  border: 2px solid rgba(255, 0, 80, 0.3);
  border-top: 2px solid #ff4081;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto ${({ theme }) => theme.spacing[2]};

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`

export const LoadingText = styled.p`
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
`

export const ErrorContainer = styled.div`
  background-color: rgba(20, 20, 20, 0.9);
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: ${({ theme }) => theme.spacing[6]};
  text-align: center;
`

export const ErrorIcon = styled.div`
  width: 3rem;
  height: 3rem;
  background-color: rgba(255, 0, 80, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto ${({ theme }) => theme.spacing[4]};
  color: #ff4081;
`

export const ErrorTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: white;
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`

export const ErrorText = styled.p`
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: ${({ theme }) => theme.spacing[4]};
  line-height: 1.5;
`

export const CloseButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[6]};
  font-size: 0.875rem;
  font-weight: 500;
  background: linear-gradient(45deg, #ff0050, #ff4081);
  color: white;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.normal};

  &:hover {
    background: linear-gradient(45deg, #ff0040, #ff3071);
    transform: translateY(-1px);
    box-shadow: 0 8px 24px rgba(255, 0, 80, 0.3);
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(255, 0, 80, 0.5);
  }
`

export const ModalFooter = styled.div`
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background-color: rgba(255, 255, 255, 0.05);
  padding: ${({ theme }) => theme.spacing[4]};
`

export const MetadataGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${({ theme }) => theme.spacing[4]};
  font-size: 0.875rem;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: repeat(4, 1fr);
  }
`

export const MetadataItem = styled.div`
  display: flex;
  flex-direction: column;
`

export const MetadataLabel = styled.span`
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: ${({ theme }) => theme.spacing[1]};
`

export const MetadataValue = styled.div`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.75rem;
  color: white;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`
