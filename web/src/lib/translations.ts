export type Language = 'en' | 'fr'

export interface Translations {
  // Navigation and views
  views: {
    seekbar: string
    explorer: string
  }
  
  // Header
  header: {
    title: string
    subtitle: string
    files: string
    refresh: string
    help: string
  }
  
  // Filtres
  filters: {
    searchPlaceholder: string
    filters: string
    advancedFilters: string
    clear: string
    clearAll: string
    dateCreation: string
    from: string
    to: string
    sizeInMB: string
    minSize: string
    maxSize: string
    customExtension: string
    extensionExamples: string
    file: string
    files: string
  }
  
  // Files and groups
  fileGroups: {
    selectAll: string
    collapseExpand: string
    expandGroup: string
    collapseGroup: string
  }
  
  // File preview
  preview: {
    previousFile: string
    nextFile: string
    download: string
    copyPath: string
    openInFolder: string
    close: string
    closeEsc: string
    zoom: string
    zoomIn: string
    zoomOut: string
    actualSize: string
    previewNotAvailable: string
    previewNotSupportedTitle: string
    previewNotSupportedText: string
    downloadFile: string
    loading: string
    loadingError: string
    errorOccurred: string
    mimeType: string
    size: string
    createdOn: string
    hash: string
  }
  
  // Upload
  upload: {
    uploadFiles: string
    dragAndDrop: string
    selectFiles: string
    uploadComplete: string
    uploadError: string
  }
  
  // Empty states
  emptyState: {
    noFiles: string
    noFilesWithFilters: string
    uploadFilesToStart: string
    clearFilters: string
    tryDifferentFilters: string
  }
  
  // General messages
  general: {
    loading: string
    error: string
    success: string
    cancel: string
    confirm: string
    yes: string
    no: string
  }
  
  // Tooltips
  tooltips: {
    seekbarView: string
    explorerView: string
  }
  
  // Time units
  time: {
    seconds: string
    minutes: string
    hours: string
    days: string
    weeks: string
    months: string
    years: string
    // Short formats
    sec: string
    min: string
    h: string
    d: string
    w: string
    m: string
    y: string
  }
}

export const translations: Record<Language, Translations> = {
  en: {
    views: {
      seekbar: 'Player',
      explorer: 'Explorer'
    },
    header: {
      title: 'Tokilane',
      subtitle: 'Your files timeline',
      files: 'Files',
      refresh: 'Refresh',
      help: 'Help'
    },
    filters: {
      searchPlaceholder: 'Search files...',
      filters: 'Filters:',
      advancedFilters: 'Advanced filters',
      clear: 'Clear',
      clearAll: 'Clear all filters',
      dateCreation: 'Creation date',
      from: 'From',
      to: 'To',
      sizeInMB: 'Size (MB)',
      minSize: 'Min. size',
      maxSize: 'Max. size',
      customExtension: 'Custom extension',
      extensionExamples: 'Examples: .zip, .mp3, .xlsx',
      file: 'file',
      files: 'files'
    },
    fileGroups: {
      selectAll: 'Select all',
      collapseExpand: 'Collapse/Expand group',
      expandGroup: 'Expand group',
      collapseGroup: 'Collapse group'
    },
    preview: {
      previousFile: 'Previous file',
      nextFile: 'Next file',
      download: 'Download',
      copyPath: 'Copy path',
      openInFolder: 'Open in folder',
      close: 'Close',
      closeEsc: 'Close (Esc)',
      zoom: 'Zoom',
      zoomIn: 'Zoom in',
      zoomOut: 'Zoom out',
      actualSize: 'Actual size',
      previewNotAvailable: 'Preview not available',
      previewNotSupportedTitle: 'Preview not available',
      previewNotSupportedText: 'This file type cannot be previewed directly.',
      downloadFile: 'Download file',
      loading: 'Loading...',
      loadingError: 'Loading error',
      errorOccurred: 'An error occurred while loading the file.',
      mimeType: 'MIME Type:',
      size: 'Size:',
      createdOn: 'Created on:',
      hash: 'Hash:',
      unableToLoadTextContent: 'Unable to load file content.',
      fileLocationMessage: 'File located at:'
    },
    upload: {
      uploadFiles: 'Upload files',
      dragAndDrop: 'Drag and drop files here',
      selectFiles: 'Select files',
      uploadComplete: 'Upload complete',
      uploadError: 'Upload error'
    },
    emptyState: {
      noFiles: 'No files found',
      noFilesWithFilters: 'No files match your filters',
      uploadFilesToStart: 'Upload files to get started',
      clearFilters: 'Clear filters',
      tryDifferentFilters: 'Try different search criteria'
    },
    general: {
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      cancel: 'Cancel',
      confirm: 'Confirm',
      yes: 'Yes',
      no: 'No'
    },
    tooltips: {
      seekbarView: 'Timeline view with seekbar - cinematic navigation',
      explorerView: 'Explorer view with filters - advanced navigation and search'
    },
    time: {
      seconds: 'seconds',
      minutes: 'minutes', 
      hours: 'hours',
      days: 'days',
      weeks: 'weeks',
      months: 'months',
      years: 'years',
      sec: 'sec',
      min: 'min',
      h: 'h',
      d: 'd',
      w: 'w',
      m: 'm',
      y: 'y',
      filesThisDay: 'files this day'
    }
  },
  fr: {
    views: {
      seekbar: 'Lecteur',
      explorer: 'Explorateur'
    },
    header: {
      title: 'Tokilane',
      subtitle: 'Timeline de vos fichiers',
      files: 'Fichiers',
      refresh: 'Actualiser',
      help: 'Aide'
    },
    filters: {
      searchPlaceholder: 'Rechercher des fichiers...',
      filters: 'Filtres :',
      advancedFilters: 'Filtres avancés',
      clear: 'Effacer',
      clearAll: 'Effacer tous les filtres',
      dateCreation: 'Date de création',
      from: 'Du',
      to: 'Au',
      sizeInMB: 'Taille (MB)',
      minSize: 'Taille min.',
      maxSize: 'Taille max.',
      customExtension: 'Extension personnalisée',
      extensionExamples: 'Exemples : .zip, .mp3, .xlsx',
      file: 'fichier',
      files: 'fichiers'
    },
    fileGroups: {
      selectAll: 'Tout sélectionner',
      collapseExpand: 'Réduire/Étendre le groupe',
      expandGroup: 'Étendre le groupe',
      collapseGroup: 'Réduire le groupe'
    },
    preview: {
      previousFile: 'Fichier précédent',
      nextFile: 'Fichier suivant',
      download: 'Télécharger',
      copyPath: 'Copier le chemin',
      openInFolder: 'Ouvrir dans le dossier',
      close: 'Fermer',
      closeEsc: 'Fermer (Échap)',
      zoom: 'Zoom',
      zoomIn: 'Zoomer',
      zoomOut: 'Dézoomer',
      actualSize: 'Taille réelle',
      previewNotAvailable: 'Aperçu non disponible',
      previewNotSupportedTitle: 'Aperçu non disponible',
      previewNotSupportedText: 'Ce type de fichier ne peut pas être prévisualisé directement.',
      downloadFile: 'Télécharger le fichier',
      loading: 'Chargement...',
      loadingError: 'Erreur de chargement',
      errorOccurred: 'Une erreur est survenue lors du chargement du fichier.',
      mimeType: 'Type MIME :',
      size: 'Taille :',
      createdOn: 'Créé le :',
      hash: 'Hash :',
      unableToLoadTextContent: 'Impossible de charger le contenu du fichier.',
      fileLocationMessage: 'Fichier situé dans :'
    },
    upload: {
      uploadFiles: 'Uploader des fichiers',
      dragAndDrop: 'Glissez-déposez vos fichiers ici',
      selectFiles: 'Sélectionner des fichiers',
      uploadComplete: 'Upload terminé',
      uploadError: 'Erreur d\'upload'
    },
    emptyState: {
      noFiles: 'Aucun fichier trouvé',
      noFilesWithFilters: 'Aucun fichier ne correspond à vos filtres',
      uploadFilesToStart: 'Uploadez des fichiers pour commencer',
      clearFilters: 'Effacer les filtres',
      tryDifferentFilters: 'Essayez des critères de recherche différents'
    },
    general: {
      loading: 'Chargement...',
      error: 'Erreur',
      success: 'Succès',
      cancel: 'Annuler',
      confirm: 'Confirmer',
      yes: 'Oui',
      no: 'Non'
    },
    tooltips: {
      seekbarView: 'Vue timeline avec seekbar - navigation cinématique',
      explorerView: 'Vue explorer avec filtres - navigation et recherche avancée'
    },
    time: {
      seconds: 'secondes',
      minutes: 'minutes',
      hours: 'heures', 
      days: 'jours',
      weeks: 'semaines',
      months: 'mois',
      years: 'années',
      sec: 'sec',
      min: 'min',
      h: 'h',
      d: 'j',
      w: 'sem',
      m: 'mois',
      y: 'an',
      filesThisDay: 'fichiers ce jour'
    }
  }
}

// Global language variable (managed by backend via app_lang)
let appLocale: Language | null = null

export const setAppLocale = (locale: Language) => {
  appLocale = locale
}

export const getCurrentLanguage = (): Language => {
  // Use app_lang from backend if available
  if (appLocale && (appLocale === 'en' || appLocale === 'fr')) {
    return appLocale
  }
  
  // Check window global variable (if set by server-side rendering)
  if (typeof window !== 'undefined' && (window as any).app_lang) {
    const locale = (window as any).app_lang
    if (locale === 'en' || locale === 'fr') {
      return locale
    }
  }
  
  return 'en' // Default to English
}

// Note: Language is managed by backend and passed via app_lang
// Configuration is done in docker-compose environment variables

export const t = (key: string, lang?: Language): string => {
  const currentLang = lang || getCurrentLanguage()
  const keys = key.split('.')
  
  let value: any = translations[currentLang]
  for (const k of keys) {
    value = value?.[k]
  }
  
  // Fallback to English if the translation does not exist
  if (!value && currentLang !== 'en') {
    let fallback: any = translations.en
    for (const k of keys) {
      fallback = fallback?.[k]
    }
    value = fallback
  }
  
  return value || key
}

// Hook React used to use translations
export const useTranslation = () => {
  const currentLang = getCurrentLanguage()
  
  return {
    t: (key: string) => t(key, currentLang),
    language: currentLang
    // Note: Language managed by backend via app_lang
  }
}
