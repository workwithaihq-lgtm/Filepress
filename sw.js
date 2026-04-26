const CACHE_VERSION = 'os-v6';
const coreAssets = ['/', '/index.html', '/style.css', '/core.js'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE_VERSION).then(c => c.addAll(coreAssets)));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.map(k => k !== CACHE_VERSION ? caches.delete(k) : null))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Bypass cache entirely for tool pages to prevent lockouts
  if (url.pathname.includes('/tools/')) {
    e.respondWith(fetch(e.request));
    return;
  }
  // Network-first for everything else
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});
