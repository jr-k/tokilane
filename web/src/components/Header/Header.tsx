import React from 'react'
import ViewSwitcher, { ViewMode } from '../ViewSwitcher/ViewSwitcher'
import {
  HeaderContainer,
  HeaderContent,
  LogoSection,
  LogoIcon,
  TitleContainer,
  Title,
  Subtitle,
  ActionsSection,
  StatsSection,
  StatItem,
  StatValue,
  StatLabel,
  Divider,
  TimeSection,
  TimeValue,
  TimeDate,
  ActionsContainer,
  ActionButton,
  ActionIcon,
  ActionText,
} from './styled'

interface HeaderProps {
  title?: string
  totalFiles?: number
  viewMode?: ViewMode
  onViewModeChange?: (mode: ViewMode) => void
}

export const Header: React.FC<HeaderProps> = ({ 
  title = 'TokiLane',
  totalFiles = 0,
  viewMode = 'seekbar',
  onViewModeChange
}) => {
  const [currentTime, setCurrentTime] = React.useState(new Date())

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)

    return () => clearInterval(timer)
  }, [])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <HeaderContainer $viewMode={viewMode}>
      <HeaderContent>
        <LogoSection>
          <LogoIcon>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </LogoIcon>
          
          <TitleContainer>
            <Title>{title}</Title>
            <Subtitle>Timeline de vos fichiers</Subtitle>
          </TitleContainer>
        </LogoSection>

        <ActionsSection>
          <StatsSection>
            <StatItem>
              <StatValue>{totalFiles.toLocaleString('fr-FR')}</StatValue>
              <StatLabel>Fichiers</StatLabel>
            </StatItem>
            
            <Divider />
            
            <TimeSection>
              <TimeValue>{formatTime(currentTime)}</TimeValue>
              <TimeDate>{formatDate(currentTime)}</TimeDate>
            </TimeSection>
          </StatsSection>

          <ActionsContainer>
            {/* ViewSwitcher intégré dans la HeaderBar */}
            {onViewModeChange && (
              <ViewSwitcher
                viewMode={viewMode}
                onViewModeChange={onViewModeChange}
              />
            )}

            <ActionButton
              onClick={() => window.location.reload()}
              title="Actualiser la page"
            >
              <ActionIcon>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </ActionIcon>
              <ActionText>Actualiser</ActionText>
            </ActionButton>
          </ActionsContainer>
        </ActionsSection>
      </HeaderContent>
    </HeaderContainer>
  )
}

export default Header
