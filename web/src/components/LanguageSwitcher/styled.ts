import styled from 'styled-components'

export const LanguageSwitcherContainer = styled.div`
  display: flex;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.2);
`

export const LanguageButton = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  padding: ${({ theme }) => theme.spacing[1]} ${({ theme }) => theme.spacing[2]};
  font-size: 0.75rem;
  font-weight: 500;
  background: ${({ $active }) =>
    $active ? 'linear-gradient(45deg, #ff0050, #ff4081)' : 'transparent'
  };
  color: ${({ $active }) =>
    $active ? 'white' : 'rgba(255, 255, 255, 0.7)'
  };
  border: none;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.normal};
  min-width: 50px;
  justify-content: center;

  &:hover {
    background: ${({ $active }) =>
      $active ? 'linear-gradient(45deg, #ff0040, #ff3071)' : 'rgba(255, 255, 255, 0.1)'
    };
    color: ${({ $active }) =>
      $active ? 'white' : 'white'
    };
  }

  &:focus {
    outline: none;
    box-shadow: inset 0 0 0 2px rgba(255, 0, 80, 0.5);
  }

  &:active {
    transform: scale(0.98);
  }
`

export const LanguageIcon = styled.span`
  font-size: 0.875rem;
  line-height: 1;
`

export const LanguageText = styled.span`
  font-weight: 600;
  font-size: 0.75rem;
`
