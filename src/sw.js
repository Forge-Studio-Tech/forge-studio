import { precacheAndRoute } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { NetworkFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

// Precache app shell (gerado pelo vite-plugin-pwa)
precacheAndRoute(self.__WB_MANIFEST)

// Cache auth — critico para cold start
registerRoute(
  ({ url }) => url.pathname === '/api/auth/me',
  new NetworkFirst({
    cacheName: 'api-auth',
    plugins: [
      new ExpirationPlugin({ maxAgeSeconds: 86400, maxEntries: 5 }),
    ],
  })
)

// Cache API geral do portal — 1h
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/') && url.pathname !== '/api/auth/me',
  new NetworkFirst({
    cacheName: 'api-portal',
    plugins: [
      new ExpirationPlugin({ maxAgeSeconds: 3600, maxEntries: 100 }),
    ],
  })
)

// Skip waiting quando solicitado pelo app
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

// Push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return

  let data
  try {
    data = event.data.json()
  } catch {
    data = { title: 'Forge Studio', body: event.data.text() }
  }

  const options = {
    body: data.body || '',
    icon: data.icon || '/logo-192.png',
    badge: data.badge || '/logo-192.png',
    data: { url: data.url || '/portal' },
    vibrate: [200, 100, 200],
    tag: data.tag || 'forge-notification',
    renotify: true,
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'Forge Studio', options)
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/portal'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      for (const client of clients) {
        if (client.url.includes('/portal') && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      return self.clients.openWindow(url)
    })
  )
})
