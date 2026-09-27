const CACHE = 'nouricircle-shell-v1'
const SHELL = ['./', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png']

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', event => {
  event.waitUntil(Promise.all([
    caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('nouricircle-shell-') && key !== CACHE).map(key => caches.delete(key)))),
    self.clients.claim(),
  ]))
})

self.addEventListener('fetch', event => {
  const request = event.request
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.endsWith('/ask-config.json')) return

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then(response => {
      if (response.ok) {
        const copy = response.clone()
        event.waitUntil(caches.open(CACHE).then(cache => cache.put(request, copy)))
      }
      return response
    }).catch(async () => (await caches.match(request)) || caches.match('./')))
    return
  }

  event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
    if (response.ok && (url.pathname.includes('/assets/') || url.pathname.includes('/icons/'))) {
      const copy = response.clone()
      event.waitUntil(caches.open(CACHE).then(cache => cache.put(request, copy)))
    }
    return response
  })))
})
