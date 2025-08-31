import styled from 'styled-components'

export const ViewSwitcherContainer = styled.div`
  display: flex;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.2);
`

export const ViewButton = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[3]};
  font-size: 0.875rem;
  font-weight: 500;
  background-color: ${({ $active }) => 
    $active ? 'linear-gradient(45deg, #ff0050, #ff4081)' : 'transparent'
  };
  color: ${({ $active }) => 
    $active ? 'white' : 'rgba(255, 255, 255, 0.7)'
  };
  border: none;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.normal};
  min-width: 100px;
  justify-content: center;

  &:hover {
    background-color: ${({ $active }) => 
      $active ? 'linear-gradient(45deg, #ff0050, #ff4081)' : 'rgba(255, 255, 255, 0.1)'
    };
    color: white;
  }

  &:focus {
    outline: none;
    box-shadow: inset 0 0 0 2px rgba(255, 0, 80, 0.5);
  }

  &:active {
    transform: scale(0.98);
  }
`

export const ViewIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
`

export const ViewText = styled.span`
  display: none;

  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    display: inline;
  }
`
