/*
 * Peanut service worker: the app shell, cached behind a versioned name.
 *
 * Two rules learned the hard way by every PWA:
 *  - the cache name must change with the release, or nobody ever sees the new
 *    build (the matching test fails if it drifts from package.json);
 *  - navigations go to the network first, so the newest index.html wins when
 *    online and the shell is what saves you offline. Hashed assets are
 *    immutable, so they are cache-first.
 *
 * All URLs are relative to this file, which lives at the base path — in
 * production `/peanut-game/sw.js`, in development `/sw.js`. Hard-coding either
 * would break the other.
 */

const CACHE = 'peanut-v0.9.0'

const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './favicon.svg',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') {
    return
  }
  if (new URL(request.url).origin !== self.location.origin) {
    return
  }

  if (request.mode === 'navigate') {
    // Network first: the freshest index.html when online, the shell when not.
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          void caches.open(CACHE).then((cache) => cache.put(request, copy))
          return response
        })
        .catch(() =>
          caches.match(request).then((hit) => hit ?? caches.match('./index.html')),
        ),
    )
    return
  }

  // Hashed assets: immutable, so cache first and never revalidate.
  event.respondWith(
    caches.match(request).then((hit) => {
      if (hit) {
        return hit
      }
      return fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone()
          void caches.open(CACHE).then((cache) => cache.put(request, copy))
        }
        return response
      })
    }),
  )
})
