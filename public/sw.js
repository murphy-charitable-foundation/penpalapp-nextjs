// Give your cache a version name
const CACHE_NAME = 'offline-cache-v1';//'my-pwa-cache-v1';
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

// When the browser requests a resource: serve from cache first, fallback to network
self.addEventListener('fetch', (event) => {

  event.respondWith(
    (async () => {
      
      const cachedResponse = await caches.match(event.request);
      if (cachedResponse) {
        return cachedResponse;
      }
      try {

        return await fetch(event.request);

      } catch(error) {

        if (event.request.mode === 'navigate') {
          const cachedOfflinePage = await caches.match(OFFLINE_URL);
          if (cachedOfflinePage){
            return cachedOfflinePage;
          }
        }

        return new Response('Resource unavailable offline.', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'text/plain' },
        });
      }
    }) ()
  );
});

// (Optional) On activation: clean up old caches if you have versioning
self.addEventListener('activate', (event) => {
  //const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    (async () => {
      // Clean up of old cache
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
