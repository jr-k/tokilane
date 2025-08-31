import styled from 'styled-components'

export const DropzoneContainer = styled.div``

export const DropzoneArea = styled.div<{ $isDragOver: boolean; $hasActiveUploads: boolean }>`
  position: relative;
  padding: ${({ theme }) => theme.spacing[8]};
  text-align: center;
  border: 2px dashed;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  transition: all ${({ theme }) => theme.transitions.normal};

  ${({ $isDragOver, $hasActiveUploads, theme }) => {
    if ($isDragOver) {
      return `
        border-color: ${theme.colors.primary[500]};
        background-color: ${theme.colors.primary[50]};
      `
    } else if ($hasActiveUploads) {
      return `
        border-color: ${theme.colors.primary[300]};
        background-color: ${theme.colors.primary[50]};
      `
    } else {
      return `
        border-color: ${theme.colors.gray[300]};
        background-color: transparent;
        
        &:hover {
          border-color: ${theme.colors.primary[400]};
          background-color: ${theme.colors.primary[25]};
        }
      `
    }
  }}
`

export const HiddenInput = styled.input`
  display: none;
`

export const DropzoneContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[4]};
`

export const DropzoneIcon = styled.div`
  width: 4rem;
  height: 4rem;
  color: ${({ theme }) => theme.colors.gray[400]};
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme }) => theme.colors.gray[200]};
  border-radius: 50%;
  margin: 0 auto;
`

export const DropzoneTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray[900]};
  margin: 0;
`

export const DropzoneText = styled.p`
  color: ${({ theme }) => theme.colors.gray[600]};
  margin: 0;
`

export const DropzoneButton = styled.button`
  color: ${({ theme }) => theme.colors.primary[600]};
  font-weight: 500;
  text-decoration: underline;
  background: none;
  border: none;
  cursor: pointer;
  transition: color ${({ theme }) => theme.transitions.normal};

  &:hover {
    color: ${({ theme }) => theme.colors.primary[700]};
  }

  &:focus {
    outline: none;
    color: ${({ theme }) => theme.colors.primary[700]};
  }
`

export const DropzoneInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[1]};
`

export const InfoText = styled.p`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.gray[500]};
  margin: 0;
`

export const ProgressContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[4]};
`

export const ProgressHeader = styled.div`
  text-align: center;
`

export const ProgressTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray[900]};
  margin: 0 0 ${({ theme }) => theme.spacing[2]} 0;
`

export const GlobalProgress = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
  align-items: center;
`

export const ProgressBar = styled.div`
  width: 100%;
  height: 0.5rem;
  background-color: ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  overflow: hidden;
`

export const ProgressFill = styled.div<{ $percentage: number }>`
  height: 100%;
  background-color: ${({ theme }) => theme.colors.primary[600]};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  width: ${({ $percentage }) => $percentage}%;
  transition: width ${({ theme }) => theme.transitions.slow};
`

export const ProgressText = styled.p`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.gray[600]};
  margin: 0;
`

export const FilesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
  max-height: 12rem;
  overflow-y: auto;
`

export const FileItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[2]};
  background-color: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
`

export const FileStatusIcon = styled.div<{ $status: string }>`
  flex-shrink: 0;
  width: 1.25rem;
  height: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;

  ${({ $status, theme }) => {
    switch ($status) {
      case 'completed':
        return `color: ${theme.colors.green[500]};`
      case 'error':
        return `color: ${theme.colors.red[500]};`
      default:
        return `color: ${theme.colors.primary[500]};`
    }
  }}

  .animate-spin {
    animation: spin 1s linear infinite;
  }
`

export const FileInfo = styled.div`
  flex: 1;
  min-width: 0;
  text-align: left;
`

export const FileName = styled.p`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.gray[900]};
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

export const FileSize = styled.p`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.gray[500]};
  margin: 0;
`

export const FileError = styled.p`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.red[600]};
  margin: ${({ theme }) => theme.spacing[1]} 0 0 0;
`

export const FileProgress = styled.div`
  flex-shrink: 0;
  width: 4rem;
  text-align: right;
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.gray[500]};
`

export const CancelButton = styled.button`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  color: ${({ theme }) => theme.colors.gray[400]};
  background: none;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  cursor: pointer;
  transition: color ${({ theme }) => theme.transitions.normal};

  &:hover {
    color: ${({ theme }) => theme.colors.gray[600]};
  }

  &:focus {
    outline: none;
    color: ${({ theme }) => theme.colors.gray[600]};
  }
`
