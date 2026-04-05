import { useState, useEffect } from 'react'

export function useUpdateAvailable() {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [registration, setRegistration] = useState(null)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    navigator.serviceWorker.ready.then(reg => {
      if (reg.waiting) {
        setUpdateAvailable(true)
        setRegistration(reg)
      }

      reg.addEventListener('updatefound', () => {
        const newSW = reg.installing
        if (!newSW) return
        newSW.addEventListener('statechange', () => {
          if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
            setUpdateAvailable(true)
            setRegistration(reg)
          }
        })
      })
    })

    // Checar atualizações a cada 5 min
    const interval = setInterval(() => {
      navigator.serviceWorker.ready.then(reg => reg.update()).catch(() => {})
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  function updateApp() {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
    }
    window.location.reload()
  }

  return { updateAvailable, updateApp }
}
