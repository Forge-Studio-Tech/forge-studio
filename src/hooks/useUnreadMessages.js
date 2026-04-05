import { useState, useEffect, useCallback, useRef } from 'react'
import { apiFetch } from './useApi.js'

// Singleton: compartilha estado entre todos os componentes que usam o hook
let globalCount = 0
let listeners = new Set()

function notify() {
  listeners.forEach(fn => fn(globalCount))
}

export function useUnreadMessages({ enabled = true, interval = 15000 } = {}) {
  const [count, setCount] = useState(globalCount)
  const prevCountRef = useRef(globalCount)

  useEffect(() => {
    listeners.add(setCount)
    setCount(globalCount)
    return () => listeners.delete(setCount)
  }, [])

  const fetch = useCallback(async () => {
    if (!enabled) return
    try {
      const data = await apiFetch('/api/whatsapp/unread-count')
      const newCount = Number(data?.count || 0)
      prevCountRef.current = globalCount
      globalCount = newCount
      notify()
    } catch {
      // silently fail
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled) return
    fetch()
    const id = setInterval(fetch, interval)
    return () => clearInterval(id)
  }, [enabled, interval, fetch])

  return {
    count,
    increased: globalCount > prevCountRef.current,
    refetch: fetch,
  }
}
