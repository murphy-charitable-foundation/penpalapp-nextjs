// Give your cache a version name
const CACHE_NAME = 'my-pwa-cache-v1';

// List of resources to cache — you can add more as needed
const URLS_TO_CACHE = [
  '/',               // cache the root HTML (start_url)
  '/murphylogo.png',    // example icon or other static assets
  // Add other urls: JS bundles, CSS, images, etc.
];

// When the SW installs: cache the listed resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(URLS_TO_CACHE))
  );
});

// When the browser requests a resource: serve from cache first, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((cachedRes) => {
        if (cachedRes) {
          return cachedRes;
        }
        return fetch(event.request);
      })
  );
});

// (Optional) On activation: clean up old caches if you have versioning
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (!cacheWhitelist.includes(key)) {
            return caches.delete(key);
          }
        })
      )
    )
  );
});
