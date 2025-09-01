import React, { useState } from 'react'
import { FileItem } from '@/types'
import { formatDate } from '@/lib/utils'
import { useTranslation } from '@/lib/translations'
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
  const { t } = useTranslation()
  const formattedDate = formatDate(date + 'T00:00:00Z')
  const fileCount = files.length
  const [isCollapsed, setIsCollapsed] = useState(false)

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed)
  }

  return (
    <GroupContainer>
      <DateHeader>
        <DateHeaderContent>
          <DateInfo>
            <DateTitle>{formattedDate}</DateTitle>
            <FileCountBadge>
              {fileCount} {fileCount > 1 ? t('filters.files') : t('filters.file')}
            </FileCountBadge>
          </DateInfo>
          
          <GroupActions>
            <ActionButton
              title={isCollapsed ? t('fileGroups.expandGroup') : t('fileGroups.collapseGroup')}
              onClick={toggleCollapse}
            >
              <ActionIcon style={{ 
                transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease'
              }}>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </ActionIcon>
            </ActionButton>
          </GroupActions>
        </DateHeaderContent>
      </DateHeader>

      {!isCollapsed && (
        <FilesGrid>
          {files.map((file) => (
            <FileCard
              key={file.id}
              file={file}
              onClick={onFileClick}
            />
          ))}
        </FilesGrid>
      )}
    </GroupContainer>
  )
}

export default FileGroup
