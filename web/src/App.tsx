import { useState, useEffect } from 'react'
import TimelineSeekbar from './pages/TimelineSeekbar'
import TimelineExplorer from './pages/TimelineStandalone'
import { useAppConfig } from './hooks/useAppConfig'

type ViewMode = 'seekbar' | 'explorer'

function App() {
  // Load app configuration from backend
  const { isLoaded: configLoaded, error: configError } = useAppConfig()
  
  // Load preference from localStorage or use 'seekbar' as default
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('tokilane-view-mode')
    // Migration: convert 'standalone' to 'explorer'
    if (saved === 'standalone') return 'explorer'
    return (saved === 'explorer' || saved === 'seekbar') ? saved : 'seekbar'
  })

  // Sauvegarder la préférence quand elle change
  const handleViewModeChange = (newMode: ViewMode) => {
    setViewMode(newMode)
    localStorage.setItem('tokilane-view-mode', newMode)
  }

  // Gérer les styles de scrollbar selon la vue
  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    const root = document.getElementById('root')

    // Nettoyer les classes existantes
    body.classList.remove('mode-seekbar', 'mode-explorer')

    if (viewMode === 'explorer') {
      // Permettre le scroll vertical pour la vue explorer
      html.style.overflow = 'auto'
      body.style.overflow = 'auto'
      html.style.height = 'auto'
      body.style.height = 'auto'
      if (root) {
        root.style.height = 'auto'
        root.style.overflow = 'auto'
      }
      body.classList.add('mode-explorer')
    } else {
      // Désactiver le scroll pour la vue seekbar
      html.style.overflow = 'hidden'
      body.style.overflow = 'hidden'
      html.style.height = '100%'
      body.style.height = '100%'
      if (root) {
        root.style.height = '100vh'
        root.style.overflow = 'hidden'
      }
      body.classList.add('mode-seekbar')
    }

    // Cleanup function pour restaurer les styles par défaut
    return () => {
      html.style.overflow = 'hidden'
      body.style.overflow = 'hidden'
      html.style.height = '100%'
      body.style.height = '100%'
      if (root) {
        root.style.height = '100vh'
        root.style.overflow = 'hidden'
      }
      body.classList.remove('mode-seekbar', 'mode-explorer')
    }
  }, [viewMode])

  // Show loading screen while configuration is loading
  if (!configLoaded) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        flexDirection: 'column',
        gap: '1rem',
        backgroundColor: '#0a0a0a',
        color: 'white'
      }}>
        <div style={{
          width: '2rem',
          height: '2rem',
          border: '3px solid rgba(255, 255, 255, 0.1)',
          borderTop: '3px solid #ff0050',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <p>Loading application configuration...</p>
        {configError && (
          <p style={{ color: '#ff6b6b', fontSize: '0.875rem' }}>
            Warning: {configError}
          </p>
        )}
      </div>
    )
  }

  return (
    <>
      {viewMode === 'seekbar' ? (
        <TimelineSeekbar 
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
        />
      ) : (
        <TimelineExplorer 
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
        />
      )}
    </>
  )
}

export default App
