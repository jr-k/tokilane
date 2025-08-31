import React from 'react'
import { ViewSwitcherContainer, ViewButton, ViewIcon, ViewText } from './styled'

export type ViewMode = 'seekbar' | 'explorer'

interface ViewSwitcherProps {
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
}

export const ViewSwitcher: React.FC<ViewSwitcherProps> = ({
  viewMode,
  onViewModeChange,
}) => {
  return (
    <ViewSwitcherContainer>
      <ViewButton
        $active={viewMode === 'seekbar'}
        onClick={() => onViewModeChange('seekbar')}
        title="Vue timeline avec seekbar - navigation fluide"
      >
        <ViewIcon>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16l13-8z" />
          </svg>
        </ViewIcon>
        <ViewText>Seekbar</ViewText>
      </ViewButton>
      
      <ViewButton
        $active={viewMode === 'explorer'}
        onClick={() => onViewModeChange('explorer')}
        title="Vue explorer avec filtres - navigation et recherche avancée"
      >
        <ViewIcon>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        </ViewIcon>
        <ViewText>Explorer</ViewText>
      </ViewButton>
    </ViewSwitcherContainer>
  )
}

export default ViewSwitcher
