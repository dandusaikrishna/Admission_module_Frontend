import { useState, useEffect } from 'react'

export function useFetch(url, options = {}) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const api = options.api || (await import('../services/api').then(m => m.default))
        const response = await api.get(url)
        if (mounted) {
          setData(response.data?.data || response.data || [])
        }
      } catch (err) {
        if (mounted) {
          setError(err?.response?.data?.message || err.message || 'Failed to fetch data')
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchData()
    return () => { mounted = false }
  }, [url])

  return { data, loading, error }
}

export default useFetch
