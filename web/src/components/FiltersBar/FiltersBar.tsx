import React, { useState, useEffect } from 'react'
import { FileFilters } from '@/types'
import { debounce } from '@/lib/utils'
import { useTranslation } from '@/lib/translations'
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
  const { t } = useTranslation()
  const [localQuery, setLocalQuery] = useState(filters.query || '')
  
  const filtersRef = React.useRef(filters)
  filtersRef.current = filters

  const debouncedSearch = React.useMemo(
    () => debounce((query: string) => {
      onFiltersChange({ ...filtersRef.current, query, page: 1 })
    }, 300),
    [onFiltersChange]
  )

  useEffect(() => {
    debouncedSearch(localQuery)
  }, [localQuery, debouncedSearch])

  // Synchroniser localQuery avec filters.query venant de l'extérieur (seulement si différent)
  useEffect(() => {
    const externalQuery = filters.query || ''
    if (localQuery !== externalQuery) {
      setLocalQuery(externalQuery)
    }
  }, [filters.query]) // Pas de localQuery dans les deps pour éviter la boucle

  const popularExtensions = ['.pdf', '.jpg', '.png', '.txt', '.md', '.docx', '.mp4']
  
  // Normaliser les extensions pour gérer les formats avec et sans point
  const normalizedAllowedExtensions = allowedExtensions.map(ext => 
    ext.startsWith('.') ? ext : `.${ext}`
  )
  
  // Temporairement, forçons quelques extensions pour tester
  let availableExtensions = popularExtensions.filter(ext => 
    normalizedAllowedExtensions.includes(ext) || 
    allowedExtensions.includes(ext) || 
    allowedExtensions.includes(ext.substring(1))
  )
  
  // Si aucune extension n'est disponible, affichons les populaires pour tester
  if (availableExtensions.length === 0) {
    availableExtensions = ['.pdf', '.jpg', '.png', '.mp4']
  }
  
  const handleExtensionFilter = (extension: string) => {
    // console.log('Extension filter clicked:', extension)
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
              placeholder={t('filters.searchPlaceholder')}
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
            />
          </SearchInputContainer>
          
          <StatsSection>
            <StatValue>{totalFiles}</StatValue>
            <StatLabel>{totalFiles > 1 ? t('filters.files') : t('filters.file')}</StatLabel>
          </StatsSection>

          {hasActiveFilters && (
            <ClearButton onClick={clearAllFilters} title={t('filters.clearAll')}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              {t('filters.clear')}
            </ClearButton>
          )}
        </SearchSection>

        {availableExtensions.length > 0 && (
          <QuickFiltersSection>
            <FilterLabel>{t('filters.filters')}</FilterLabel>
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
            <AdvancedFiltersTitle>{t('filters.advancedFilters')}</AdvancedFiltersTitle>
          </AdvancedFiltersSummary>
          
          <AdvancedFiltersContent>
            <FilterGrid>
              <FilterGroup>
                <FilterGroupLabel>{t('filters.dateCreation')}</FilterGroupLabel>
                <FilterInputGroup>
                  <FilterInput
                    type="date"
                    placeholder={t('filters.from')}
                    value={filters.date_from || ''}
                    onChange={(e) => handleDateFromChange(e.target.value)}
                  />
                  <FilterInput
                    type="date"
                    placeholder={t('filters.to')}
                    value={filters.date_to || ''}
                    onChange={(e) => handleDateToChange(e.target.value)}
                  />
                </FilterInputGroup>
              </FilterGroup>

              <FilterGroup>
                <FilterGroupLabel>{t('filters.sizeInMB')}</FilterGroupLabel>
                <FilterInputGroup>
                  <FilterInput
                    type="number"
                    placeholder={t('filters.minSize')}
                    min="0"
                    value={filters.min_size ? Math.round(filters.min_size / (1024 * 1024)) : ''}
                    onChange={(e) => handleSizeFilter('min', e.target.value)}
                  />
                  <FilterInput
                    type="number"
                    placeholder={t('filters.maxSize')}
                    min="0"
                    value={filters.max_size ? Math.round(filters.max_size / (1024 * 1024)) : ''}
                    onChange={(e) => handleSizeFilter('max', e.target.value)}
                  />
                </FilterInputGroup>
              </FilterGroup>

              <FilterGroup>
                <FilterGroupLabel>{t('filters.customExtension')}</FilterGroupLabel>
                <FilterInput
                  type="text"
                  placeholder=".ext"
                  value={filters.extension && !availableExtensions.includes(filters.extension) ? filters.extension : ''}
                  onChange={(e) => onFiltersChange({ ...filters, extension: e.target.value, page: 1 })}
                />
                <FilterDescription>
                  {t('filters.extensionExamples')}
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
