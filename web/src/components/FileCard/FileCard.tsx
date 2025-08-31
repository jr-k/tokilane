import React from 'react'
import { FileItem } from '@/types'
import { formatTime, getFileIcon, getThumbnailUrl } from '@/lib/utils'
import {
  CardContainer,
  ImageContainer,
  ThumbnailImage,
  FallbackIcon,
  FallbackContainer,
  FallbackText,
  ExtensionBadge,
  PreviewBadge,
  PreviewIcon,
  InfoContainer,
  FileName,
  FileDetails,
  SizeTime,
  MimeType,
  HoverOverlay,
} from './styled'

interface FileCardProps {
  file: FileItem
  onClick: (file: FileItem) => void
  className?: string
}

export const FileCard: React.FC<FileCardProps> = ({ file, onClick, className }) => {
  const handleClick = () => {
    onClick(file)
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onClick(file)
    }
  }

  return (
    <CardContainer
      className={className}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Ouvrir le fichier ${file.name}`}
    >
      <ImageContainer>
        {file.has_thumbnail && file.thumb_url ? (
          <ThumbnailImage
            src={getThumbnailUrl(file.id)}
            alt={file.name}
            loading="lazy"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
              target.nextElementSibling?.classList.remove('hidden')
            }}
          />
        ) : null}
        
        <FallbackContainer className={file.has_thumbnail && file.thumb_url ? 'hidden' : ''}>
          <FallbackIcon>{getFileIcon(file.ext)}</FallbackIcon>
          <FallbackText>{file.ext.replace('.', '').toUpperCase()}</FallbackText>
        </FallbackContainer>

        <ExtensionBadge>
          {file.ext.replace('.', '').toUpperCase()}
        </ExtensionBadge>

        {file.has_preview && (
          <PreviewBadge>
            <PreviewIcon>
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </PreviewIcon>
          </PreviewBadge>
        )}
      </ImageContainer>

      <InfoContainer>
        <FileName title={file.name}>
          {file.name}
        </FileName>

        <FileDetails>
          <SizeTime>
            <span>{file.size_formatted}</span>
            <span>{formatTime(file.created_at)}</span>
          </SizeTime>

          <MimeType title={file.mime}>
            {file.mime}
          </MimeType>
        </FileDetails>
      </InfoContainer>

      <HoverOverlay />
    </CardContainer>
  )
}

export default FileCard
