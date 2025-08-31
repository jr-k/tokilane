import React, { useState, useEffect } from 'react'
import { FileFilters } from '@/types'
import { debounce } from '@/lib/utils'
import {
  FilterContainer,
  FilterContent,
  SearchSection,
  SearchInputContainer,
  SearchIcon,
  SearchInput,
  StatsSection,
  StatValue,
  StatLabel,
  ClearButton,
  QuickFiltersSection,
  FilterLabel,
  ExtensionButton,
  AdvancedFilters,
  AdvancedFiltersSummary,
  AdvancedFiltersIcon,
  AdvancedFiltersTitle,
  AdvancedFiltersContent,
  FilterGrid,
  FilterGroup,
  FilterGroupLabel,
  FilterInputGroup,
  FilterInput,
  FilterDescription,
} from './styled'

interface FiltersBarProps {
  filters: FileFilters
  onFiltersChange: (filters: FileFilters) => void
  allowedExtensions?: string[]
  totalFiles?: number
  className?: string
}

export const FiltersBar: React.FC<FiltersBarProps> = ({
  filters,
  onFiltersChange,
  allowedExtensions = [],
  totalFiles = 0,
  className = '',
}) => {
  const [localQuery, setLocalQuery] = useState(filters.query || '')
  
  const debouncedSearch = debounce((query: string) => {
    onFiltersChange({ ...filters, query, page: 1 })
  }, 300)

  useEffect(() => {
    debouncedSearch(localQuery)
  }, [localQuery, debouncedSearch])

  const popularExtensions = ['.pdf', '.jpg', '.png', '.txt', '.md', '.docx', '.mp4']
  const availableExtensions = popularExtensions.filter(ext => 
    allowedExtensions.includes(ext)
  )

  const handleExtensionFilter = (extension: string) => {
    const newExt = filters.extension === extension ? '' : extension
    onFiltersChange({ ...filters, extension: newExt, page: 1 })
  }

  const handleDateFromChange = (date: string) => {
    onFiltersChange({ ...filters, date_from: date || undefined, page: 1 })
  }

  const handleDateToChange = (date: string) => {
    onFiltersChange({ ...filters, date_to: date || undefined, page: 1 })
  }

  const handleSizeFilter = (type: 'min' | 'max', value: string) => {
    const size = value ? parseInt(value) * 1024 * 1024 : undefined
    const newFilters = { ...filters, page: 1 }
    
    if (type === 'min') {
      newFilters.min_size = size
    } else {
      newFilters.max_size = size
    }
    
    onFiltersChange(newFilters)
  }

  const clearAllFilters = () => {
    setLocalQuery('')
    onFiltersChange({
      query: '',
      extension: '',
      date_from: undefined,
      date_to: undefined,
      min_size: undefined,
      max_size: undefined,
      page: 1,
    })
  }

  const hasActiveFilters = !!(
    filters.query ||
    filters.extension ||
    filters.date_from ||
    filters.date_to ||
    filters.min_size ||
    filters.max_size
  )

  return (
    <FilterContainer className={className}>
      <FilterContent>
        <SearchSection>
          <SearchInputContainer>
            <SearchIcon>
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </SearchIcon>
            <SearchInput
              type="text"
              placeholder="Rechercher des fichiers..."
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
            />
          </SearchInputContainer>
          
          <StatsSection>
            <StatValue>{totalFiles}</StatValue>
            <StatLabel>fichier{totalFiles > 1 ? 's' : ''}</StatLabel>
          </StatsSection>

          {hasActiveFilters && (
            <ClearButton onClick={clearAllFilters} title="Effacer tous les filtres">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Effacer
            </ClearButton>
          )}
        </SearchSection>

        {availableExtensions.length > 0 && (
          <QuickFiltersSection>
            <FilterLabel>Filtres :</FilterLabel>
            {availableExtensions.map((ext) => (
              <ExtensionButton
                key={ext}
                $active={filters.extension === ext}
                onClick={() => handleExtensionFilter(ext)}
              >
                {ext}
              </ExtensionButton>
            ))}
          </QuickFiltersSection>
        )}

        <AdvancedFilters>
          <AdvancedFiltersSummary>
            <AdvancedFiltersIcon>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </AdvancedFiltersIcon>
            <AdvancedFiltersTitle>Filtres avancés</AdvancedFiltersTitle>
          </AdvancedFiltersSummary>
          
          <AdvancedFiltersContent>
            <FilterGrid>
              <FilterGroup>
                <FilterGroupLabel>Date de création</FilterGroupLabel>
                <FilterInputGroup>
                  <FilterInput
                    type="date"
                    placeholder="Du"
                    value={filters.date_from || ''}
                    onChange={(e) => handleDateFromChange(e.target.value)}
                  />
                  <FilterInput
                    type="date"
                    placeholder="Au"
                    value={filters.date_to || ''}
                    onChange={(e) => handleDateToChange(e.target.value)}
                  />
                </FilterInputGroup>
              </FilterGroup>

              <FilterGroup>
                <FilterGroupLabel>Taille (MB)</FilterGroupLabel>
                <FilterInputGroup>
                  <FilterInput
                    type="number"
                    placeholder="Taille min."
                    min="0"
                    value={filters.min_size ? Math.round(filters.min_size / (1024 * 1024)) : ''}
                    onChange={(e) => handleSizeFilter('min', e.target.value)}
                  />
                  <FilterInput
                    type="number"
                    placeholder="Taille max."
                    min="0"
                    value={filters.max_size ? Math.round(filters.max_size / (1024 * 1024)) : ''}
                    onChange={(e) => handleSizeFilter('max', e.target.value)}
                  />
                </FilterInputGroup>
              </FilterGroup>

              <FilterGroup>
                <FilterGroupLabel>Extension personnalisée</FilterGroupLabel>
                <FilterInput
                  type="text"
                  placeholder=".ext"
                  value={filters.extension && !availableExtensions.includes(filters.extension) ? filters.extension : ''}
                  onChange={(e) => onFiltersChange({ ...filters, extension: e.target.value, page: 1 })}
                />
                <FilterDescription>
                  Exemples : .zip, .mp3, .xlsx
                </FilterDescription>
              </FilterGroup>
            </FilterGrid>
          </AdvancedFiltersContent>
        </AdvancedFilters>
      </FilterContent>
    </FilterContainer>
  )
}

export default FiltersBar
