// CMMS Pro - PWA Service Worker for Web Push Notifications

self.addEventListener('push', function (event) {
  if (!event.data) return

  try {
    const data = event.data.json()
    const title = data.title || 'CMMS Pro'
    const options = {
      body: data.body || 'Nueva notificación del sistema de mantenimiento.',
      icon: data.icon || '/icon-192.png',
      badge: data.badge || '/icon-192.png',
      data: {
        url: data.url || '/dashboard',
      },
      vibrate: [100, 50, 100],
      tag: data.tag || 'cmms-pro-notification',
      renotify: true,
    }

    event.waitUntil(self.registration.showNotification(title, options))
  } catch (err) {
    console.error('Error handling push event:', err)
  }
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()

  const targetUrl = event.notification.data?.url || '/dashboard'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i]
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus()
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl)
      }
    })
  )
})
