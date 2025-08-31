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
  max-height: 95vh;
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
  height: 100%;
  overflow: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing[4]};
  position: relative;
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
  transform: scale(${({ $zoom }) => $zoom});
  transform-origin: center;
  transition: transform ${({ theme }) => theme.transitions.normal};
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
  background-color: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.gray[900]};
`

export const UnsupportedContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  max-width: ${({ theme }) => theme.spacing[16]};
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
  color: ${({ theme }) => theme.colors.gray[900]};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`

export const UnsupportedText = styled.p`
  color: ${({ theme }) => theme.colors.gray[600]};
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
  background-color: ${({ theme }) => theme.colors.primary[600]};
  color: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.primary[600]};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.normal};

  &:hover {
    background-color: ${({ theme }) => theme.colors.primary[700]};
    border-color: ${({ theme }) => theme.colors.primary[700]};
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary[500]};
  }
`

export const LoadingContainer = styled.div`
  background-color: ${({ theme }) => theme.colors.white};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  box-shadow: ${({ theme }) => theme.shadows.xl};
  padding: ${({ theme }) => theme.spacing[8]};
  text-align: center;
  position: relative;
`

export const LoadingSpinner = styled.div`
  width: 2rem;
  height: 2rem;
  border: 2px solid ${({ theme }) => theme.colors.primary[500]};
  border-top: 2px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto ${({ theme }) => theme.spacing[2]};
`

export const LoadingText = styled.p`
  color: ${({ theme }) => theme.colors.gray[500]};
  margin: 0;
`

export const ErrorContainer = styled.div`
  background-color: ${({ theme }) => theme.colors.white};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  box-shadow: ${({ theme }) => theme.shadows.xl};
  padding: ${({ theme }) => theme.spacing[6]};
  text-align: center;
  max-width: ${({ theme }) => theme.spacing[16]};
`

export const ErrorIcon = styled.div`
  width: 3rem;
  height: 3rem;
  background-color: ${({ theme }) => theme.colors.red[100]};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto ${({ theme }) => theme.spacing[4]};
  color: ${({ theme }) => theme.colors.red[500]};
`

export const ErrorTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray[900]};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`

export const ErrorText = styled.p`
  color: ${({ theme }) => theme.colors.gray[600]};
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
  background-color: ${({ theme }) => theme.colors.primary[600]};
  color: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.primary[600]};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.normal};

  &:hover {
    background-color: ${({ theme }) => theme.colors.primary[700]};
    border-color: ${({ theme }) => theme.colors.primary[700]};
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary[500]};
  }
`

export const ModalFooter = styled.div`
  border-top: 1px solid ${({ theme }) => theme.colors.gray[200]};
  background-color: ${({ theme }) => theme.colors.gray[50]};
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
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-bottom: ${({ theme }) => theme.spacing[1]};
`

export const MetadataValue = styled.div`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.gray[900]};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`
