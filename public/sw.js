// Give your cache a version name
const CACHE_NAME = 'offline-cache-v1';
const OFFLINE_URL = '/offline.html';
const ASSETS_TO_CACHE = ['/offline.html','/murphylogo.png'];

// When the SW installs: cache the listed resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(ASSETS_TO_CACHE);
    })()
  );
  // Optional but recommended: This is to make the waiting service worker to be the active service worker
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
      // Optional but recommended: Ensure that the Service Worker takes control immediately
      await self.clients.claim();
    })()
  );
});

// Handle GET requests only: return cached static assets when available, 
// and serve the offline page if a navigation request fails.
self.addEventListener('fetch', (event) => {

  const { request } = event;

  // Allow the non-GET requests to go to the network normally
  if (request.method !== 'GET') {
    return;
  }

  event.respondWith(
    (async () => {

      const cacheOffline = await caches.open(CACHE_NAME);
      
      // For navigation, network first, then fallback to offline page
      if (request.mode === 'navigate') {
        try {
          return await fetch(request);
        } catch {
          const cachedOfflinePage = await cacheOffline.match(OFFLINE_URL);
          if (cachedOfflinePage){
            return cachedOfflinePage;
          }

          return new Response('Offline page unavailable.', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain' },
          });
        } 
      }

      // For other GET requests (like the logo), use cache first
      const cachedResponse = await cacheOffline.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // For the rest, try network first, and let error messages display normally
      return fetch(request); 
    }) ()
  );
});

