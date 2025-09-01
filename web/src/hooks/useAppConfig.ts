import { useState, useEffect } from 'react'
import { getAppConfig } from '@/lib/api'
import { setAppLocale, Language } from '@/lib/translations'

interface AppConfig {
  locale: Language
  isLoaded: boolean
  error: string | null
}

export const useAppConfig = (): AppConfig => {
  const [config, setConfig] = useState<AppConfig>({
    locale: 'en',
    isLoaded: false,
    error: null
  })

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const backendConfig = await getAppConfig()
        
        // Validate and set locale
        const locale = (backendConfig.app_lang === 'fr') ? 'fr' : 'en'
        
        // Set global locale for translations
        setAppLocale(locale)
        
        setConfig({
          locale,
          isLoaded: true,
          error: null
        })
        
        // console.log('App configuration loaded:', { locale })
      } catch (error) {
        console.error('Failed to load app configuration:', error)
        
        // Use default configuration
        setAppLocale('en')
        setConfig({
          locale: 'en',
          isLoaded: true,
          error: 'Failed to load configuration from backend'
        })
      }
    }

    loadConfig()
  }, [])

  return config
}
