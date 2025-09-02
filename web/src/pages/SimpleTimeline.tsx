import React, { useState, useEffect } from 'react'

const SimpleTimeline: React.FC = () => {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [hasLoaded, setHasLoaded] = useState(false)

  useEffect(() => {
    if (hasLoaded) {
      // console.log('Déjà chargé, pas de rechargement')
      return
    }

    const loadData = async () => {
      try {
        // console.log('Chargement des données...')
        setLoading(true)
        const response = await fetch('/api/timeline?page=1&page_size=50')
        const result = await response.json()
        // console.log('Données reçues:', result)
        setData(result)
        setHasLoaded(true)
      } catch (error) {
        console.error('Erreur:', error)
        setHasLoaded(true) // Mark as loaded even on error to prevent infinite retries
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [hasLoaded])

  if (loading) {
    return <div style={{ padding: '2rem' }}>Chargement...</div>
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Timeline Simple</h1>
      <p>Total de fichiers: {data?.total || 0}</p>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}

export default SimpleTimeline
