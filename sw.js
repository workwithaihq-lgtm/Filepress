// INCREMENT CACHE_VERSION ON EVERY GITHUB PUSH TO BUST THE CACHE
const CACHE_VERSION = 'optistream-cache-v1'; 
const urlsToCache = ['/', '/index.html', '/manifest.json'];

// Install: Cache core assets
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

// Activate: Purge obsolete caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_VERSION) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: MPA Bypass & Network-First Strategy
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // EXTERNAL PAGE BYPASS: If the user navigates to an external .html file (e.g. /about.html), bypass the cache completely.
  if (url.pathname.endsWith('.html') && url.pathname !== '/index.html' && url.pathname !== '/') {
    event.respondWith(fetch(event.request));
    return;
  }

  // SPA LOGIC: Network-First, fallback to cache
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_VERSION).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
