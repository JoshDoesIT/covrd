/**
 * Self-destructing Service Worker
 *
 * This file replaces the old offline-first service worker that caused aggressive
 * caching and locked users onto old deployments by serving a cached index.html.
 *
 * It immediately activates and deletes all caches upon installation to ensure
 * old offline-first data is cleared.
 */
self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => {
            return caches.delete(name)
          }),
        )
      })
      .then(() => {
        return self.clients.claim()
      }),
  )
})

self.addEventListener('fetch', () => {
  // Pass-through: do not handle any requests so network routing is native
})
