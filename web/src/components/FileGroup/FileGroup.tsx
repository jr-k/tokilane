import React from 'react'
import { FileItem } from '@/types'
import { formatDate } from '@/lib/utils'
import FileCard from '../FileCard/FileCard'
import {
  GroupContainer,
  DateHeader,
  DateHeaderContent,
  DateInfo,
  DateTitle,
  FileCountBadge,
  GroupActions,
  ActionButton,
  ActionIcon,
  FilesGrid,
} from './styled'

interface FileGroupProps {
  date: string
  files: FileItem[]
  onFileClick: (file: FileItem) => void
}

export const FileGroup: React.FC<FileGroupProps> = ({ date, files, onFileClick }) => {
  const formattedDate = formatDate(date + 'T00:00:00Z')
  const fileCount = files.length

  return (
    <GroupContainer>
      <DateHeader>
        <DateHeaderContent>
          <DateInfo>
            <DateTitle>{formattedDate}</DateTitle>
            <FileCountBadge>
              {fileCount} fichier{fileCount > 1 ? 's' : ''}
            </FileCountBadge>
          </DateInfo>
          
          <GroupActions>
            <ActionButton
              title="Tout sélectionner"
              onClick={() => {
                console.log('Sélectionner tous les fichiers de', date)
              }}
            >
              <ActionIcon>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </ActionIcon>
            </ActionButton>
            
            <ActionButton
              title="Réduire/Étendre le groupe"
              onClick={() => {
                console.log('Toggle group', date)
              }}
            >
              <ActionIcon>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </ActionIcon>
            </ActionButton>
          </GroupActions>
        </DateHeaderContent>
      </DateHeader>

      <FilesGrid>
        {files.map((file) => (
          <FileCard
            key={file.id}
            file={file}
            onClick={onFileClick}
          />
        ))}
      </FilesGrid>
    </GroupContainer>
  )
}

export default FileGroup
