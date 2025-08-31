import styled from 'styled-components'

export const FilterContainer = styled.div`
  background-color: rgba(20, 20, 20, 0.95);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
`

export const FilterContent = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing[4]};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[4]};

  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    padding: ${({ theme }) => theme.spacing[4]} ${({ theme }) => theme.spacing[6]};
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    padding: ${({ theme }) => theme.spacing[4]} ${({ theme }) => theme.spacing[8]};
  }
`

export const SearchSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[4]};
`

export const SearchInputContainer = styled.div`
  flex: 1;
  position: relative;
`

export const SearchIcon = styled.div`
  position: absolute;
  top: 50%;
  left: ${({ theme }) => theme.spacing[3]};
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.5);
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
`

export const SearchInput = styled.input`
  width: 100%;
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[4]};
  padding-left: 2.5rem;
  font-size: 0.875rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
  transition: all ${({ theme }) => theme.transitions.normal};

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }

  &:focus {
    outline: none;
    border-color: rgba(255, 0, 80, 0.8);
    box-shadow: 0 0 0 2px rgba(255, 0, 80, 0.3);
  }
`

export const StatsSection = styled.div`
  display: none;
  align-items: center;
  font-size: 0.875rem;

  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    display: flex;
  }
`

export const StatValue = styled.span`
  font-weight: 500;
  color: white;
  margin-right: ${({ theme }) => theme.spacing[1]};
`

export const StatLabel = styled.span`
  color: rgba(255, 255, 255, 0.6);
`

export const ClearButton = styled.button`
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

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(255, 0, 80, 0.5);
  }
`

export const QuickFiltersSection = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
`

export const FilterLabel = styled.span`
  font-size: 0.875rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
`

export const ExtensionButton = styled.button<{ $active: boolean }>`
  padding: ${({ theme }) => theme.spacing[1]} ${({ theme }) => theme.spacing[3]};
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  border: 1px solid;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.normal};

  ${({ $active }) => $active ? `
    background: linear-gradient(45deg, #ff0050, #ff4081);
    color: white;
    border-color: transparent;
  ` : `
    background-color: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.8);
    border-color: rgba(255, 255, 255, 0.2);
    
    &:hover {
      background-color: rgba(255, 255, 255, 0.2);
      color: white;
    }
  `}

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(255, 0, 80, 0.5);
  }
`

export const AdvancedFilters = styled.details`
  &[open] summary svg {
    transform: rotate(90deg);
  }
`

export const AdvancedFiltersSummary = styled.summary`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  font-size: 0.875rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition: color ${({ theme }) => theme.transitions.normal};

  &:hover {
    color: white;
  }

  &:focus {
    outline: none;
    color: #ff4081;
  }
`

export const AdvancedFiltersIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform ${({ theme }) => theme.transitions.normal};
`

export const AdvancedFiltersTitle = styled.span``

export const AdvancedFiltersContent = styled.div`
  margin-top: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[4]};
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  border: 1px solid rgba(255, 255, 255, 0.1);
`

export const FilterGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing[4]};

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: repeat(3, 1fr);
  }
`

export const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
`

export const FilterGroupLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
`

export const FilterInputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
`

export const FilterInput = styled.input`
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[3]};
  font-size: 0.875rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
  transition: all ${({ theme }) => theme.transitions.normal};

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }

  &:focus {
    outline: none;
    border-color: rgba(255, 0, 80, 0.8);
    box-shadow: 0 0 0 2px rgba(255, 0, 80, 0.3);
  }
`

export const FilterDescription = styled.p`
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
`
