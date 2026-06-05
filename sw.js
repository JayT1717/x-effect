// Service Worker - Updated with draggable cards feature
// Last updated: 2026-06-05T17:30:00Z
const CACHE_NAME = 'xeffect-v2-20260605';
const STATIC_ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json'
];

const CRITICAL_FILES = ['./index.html', './app.js', './style.css'];

// Install event - cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network-first for critical files, cache-first for others
self.addEventListener('fetch', event => {
  const isCritical = CRITICAL_FILES.some(file => event.request.url.includes(file));

  if (isCritical) {
    // Network-first strategy for critical files
    event.respondWith(
      fetch(event.request).then(response => {
        if (!response || response.status !== 200) {
          return caches.match(event.request);
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });
        return response;
      }).catch(() => {
        return caches.match(event.request);
      })
    );
  } else {
    // Cache-first strategy for other assets
    event.respondWith(
      caches.match(event.request).then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request).then(response => {
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          return response;
        }).catch(() => {
          return caches.match('./index.html');
        });
      })
    );
  }
});
