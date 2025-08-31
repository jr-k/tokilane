import styled from 'styled-components'

export const GroupContainer = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing[8]};
  animation: fadeInUp 0.3s ease-out;

  &:last-child {
    margin-bottom: 0;
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`

export const DateHeader = styled.div`
  position: sticky;
  top: 5rem;
  z-index: ${({ theme }) => theme.zIndex[10]};
  background-color: rgba(10, 10, 10, 0.9);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding: ${({ theme }) => theme.spacing[3]} 0;
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`

export const DateHeaderContent = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 ${({ theme }) => theme.spacing[4]};
  display: flex;
  align-items: center;
  justify-content: space-between;

  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    padding: 0 ${({ theme }) => theme.spacing[6]};
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    padding: 0 ${({ theme }) => theme.spacing[8]};
  }
`

export const DateInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
`

export const DateTitle = styled.h2`
  font-size: 1.125rem;
  font-weight: 600;
  color: white;
`

export const FileCountBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: ${({ theme }) => theme.spacing[1]} ${({ theme }) => theme.spacing[2]};
  font-size: 0.75rem;
  font-weight: 500;
  background: linear-gradient(45deg, #ff0050, #ff4081);
  color: white;
  border-radius: ${({ theme }) => theme.borderRadius.full};
`

export const GroupActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
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

export const FilesGrid = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 ${({ theme }) => theme.spacing[4]};
  display: grid;
  gap: ${({ theme }) => theme.spacing[4]};
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));

  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    padding: 0 ${({ theme }) => theme.spacing[6]};
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    padding: 0 ${({ theme }) => theme.spacing[8]};
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.xl}) {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }
`
