import { useState, useEffect, useCallback } from 'react'

const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
const API_URL = import.meta.env.VITE_API_URL || (IS_LOCAL ? 'http://localhost:3000' : 'https://api.forgestudio.tech')

export async function apiFetch(path, options = {}) {
  const headers = {
    'X-Requested-With': 'XMLHttpRequest',
    ...options.headers,
  }

  if (options.body) {
    headers['Content-Type'] = 'application/json'
  }

  let res
  try {
    res = await fetch(`${API_URL}${path}`, {
      credentials: 'include',
      ...options,
      headers,
    })
  } catch {
    throw new Error('Erro de conexao com o servidor. Verifique sua internet e tente novamente.')
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || `Erro ${res.status}`)
  }

  const text = await res.text()
  return text ? JSON.parse(text) : {}
}

export function useApi(path, { skip = false } = {}) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(!skip)
  const [error, setError] = useState(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await apiFetch(path)
      setData(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [path])

  useEffect(() => {
    if (!skip) refetch()
  }, [refetch, skip])

  return { data, loading, error, refetch }
}
