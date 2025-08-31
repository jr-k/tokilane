import { useState, useEffect } from 'react'
import TimelineSeekbar from './pages/TimelineSeekbar'
import TimelineExplorer from './pages/TimelineStandalone'

type ViewMode = 'seekbar' | 'explorer'

function App() {
  // Charger la préférence depuis localStorage ou utiliser 'seekbar' par défaut
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('tokilane-view-mode')
    // Migration: convertir 'standalone' vers 'explorer'
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
