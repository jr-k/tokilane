import styled from 'styled-components'

export const HeaderContainer = styled.header<{ $viewMode?: string }>`
  background-color: rgba(20, 20, 20, 0.95);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  position: sticky;
  top: 0;
  z-index: ${({ theme }) => theme.zIndex[50]};
  backdrop-filter: blur(20px);
`

export const HeaderContent = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 ${({ theme }) => theme.spacing[4]};
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 4rem;

  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    padding: 0 ${({ theme }) => theme.spacing[6]};
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    padding: 0 ${({ theme }) => theme.spacing[8]};
  }
`

export const LogoSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[4]};
`

export const LogoIcon = styled.div`
  width: 2rem;
  height: 2rem;
  background: linear-gradient(45deg, #ff0050, #ff4081);
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 4px 12px rgba(255, 0, 80, 0.3);
`

export const TitleContainer = styled.div`
  display: flex;
  flex-direction: column;
`

export const Title = styled.h1`
  font-size: 1.25rem;
  font-weight: 700;
  color: white;
  line-height: 1.2;
`

export const Subtitle = styled.p`
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
  display: none;

  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    display: block;
  }
`

export const ActionsSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[6]};
`

export const StatsSection = styled.div`
  display: none;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[4]};
  font-size: 0.875rem;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    display: flex;
  }
`

export const StatItem = styled.div`
  text-align: center;
`

export const StatValue = styled.div`
  font-weight: 600;
  color: white;
`

export const StatLabel = styled.div`
  color: rgba(255, 255, 255, 0.6);
`

export const Divider = styled.div`
  width: 1px;
  height: 2rem;
  background-color: rgba(255, 255, 255, 0.2);
`

export const TimeSection = styled.div`
  text-align: center;
`

export const TimeValue = styled.div`
  font-weight: 600;
  color: white;
`

export const TimeDate = styled.div`
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
`

export const ActionsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
`

export const ActionButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[3]};
  font-size: 0.875rem;
  font-weight: 500;
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

  &:active {
    background-color: rgba(255, 255, 255, 0.2);
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

export const ActionText = styled.span`
  display: none;

  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    display: inline;
  }
`
