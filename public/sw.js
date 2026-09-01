self.addEventListener('notificationclick', (event) => {
  event.stopImmediatePropagation();
  event.notification.close();

  event.waitUntil(
    (async () => {
      const fcmPayload = event.notification?.data?.FCM_MSG;
      const clickAction =
        event.notification?.data?.click_action ||
        event.notification?.data?.link ||
        fcmPayload?.data?.click_action ||
        fcmPayload?.fcmOptions?.link ||
        '/inbox';

      const allClients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });

      const matchingClient = allClients.find((client) => {
        try {
          const clientUrl = new URL(client.url);
          return clientUrl.pathname === clickAction || clientUrl.pathname.startsWith(clickAction);
        } catch {
          return false;
        }
      });

      if (matchingClient && 'focus' in matchingClient) {
        return matchingClient.focus();
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(clickAction);
      }
    })(),
  );
});

const getPushPayload = (event) => {
  try {
    return event.data?.json() || null;
  } catch (error) {
    console.error('[Notifications] Failed to parse push payload:', error);
    return null;
  }
};

self.addEventListener('push', (event) => {
  const payload = getPushPayload(event);
  if (!payload) return;

  event.stopImmediatePropagation();

  const title =
    payload.notification?.title ||
    payload.data?.title ||
    'New Conversation Message';
  const body =
    payload.notification?.body ||
    payload.data?.body ||
    'You have a new message.';
  const clickAction =
    payload.data?.click_action ||
    payload.fcmOptions?.link ||
    payload.notification?.click_action ||
    '/inbox';

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: payload.notification?.icon || '/murphylogo.png',
      image: payload.notification?.image,
      data: {
        click_action: clickAction,
        FCM_MSG: payload,
      },
    }),
  );
});

const CACHE_NAME = 'offline-cache-v3';
const CACHE_PREFIX = 'offline-cache-';
const OFFLINE_URL = '/offline.html';
const ASSETS_TO_CACHE = ['/offline.html','/murphylogo.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(ASSETS_TO_CACHE);
    })(),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map((key) => {
          if (key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME) {
            return caches.delete(key);
          }
          return Promise.resolve(false);
        }),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') {
    return;
  }

  event.respondWith(
    (async () => {
      const cacheOffline = await caches.open(CACHE_NAME);

      if (request.mode === 'navigate') {
        try {
          return await fetch(request);
        } catch (error) {
          const cachedOfflinePage = await cacheOffline.match(OFFLINE_URL);
          if (cachedOfflinePage) {
            return cachedOfflinePage;
          }

          return new Response('Offline page unavailable.', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain' },
          });
        }
      }

      const cachedResponse = await cacheOffline.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }

      try {
        return await fetch(request);
      } catch (error) {
        return new Response('Failed to fetch resource.', {
          status: 500,
          statusText: 'Internal Server Error',
          headers: { 'Content-Type': 'text/plain' },
        });
      }
    })(),
  );
});
