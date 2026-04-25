// INCREMENT THIS VERSION TO BREAK THE CACHE ON NEXT DEPLOYMENT
const CACHE_VERSION = 'qc-cache-v3'; 
const urlsToCache = ['/', '/index.html', '/manifest.json'];

// 1. Install & Force Takeover
self.addEventListener('install', event => {
  self.skipWaiting(); // Do not wait for the user to close the tab. Take over immediately.
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => {
      console.log('Service Worker: Caching Files');
      return cache.addAll(urlsToCache);
    })
  );
});

// 2. Activate & Destroy Old Caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_VERSION) {
            console.log('Service Worker: Deleting old cache -', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Claim control of all open browser windows
  );
});

// 3. Network-First Fetch Strategy
self.addEventListener('fetch', event => {
  event.respondWith(
    // Always attempt to fetch from the LIVE VERCEL SERVER first
    fetch(event.request)
      .then(response => {
        // If live fetch works, update the cache silently with the newest file
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_VERSION).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // If the live fetch fails (user has no internet), serve the cached file
        console.log('Service Worker: Network failed, falling back to cache.');
        return caches.match(event.request);
      })
  );
});