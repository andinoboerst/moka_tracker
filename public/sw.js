// Minimal service worker: makes the app installable and keeps the shell usable offline.
const CACHE = 'moka-shell-v1'
const SHELL = ['/', '/icon.png']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  // Never cache API calls, auth or cross-origin requests
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api') || url.pathname.startsWith('/auth')) {
    return
  }
  // Network first, fall back to cache when offline
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok && (request.mode === 'navigate' || url.pathname.startsWith('/_next/static'))) {
          const copy = response.clone()
          caches.open(CACHE).then((cache) => cache.put(request, copy))
        }
        return response
      })
      .catch(() => caches.match(request).then((hit) => hit || caches.match('/')))
  )
})
