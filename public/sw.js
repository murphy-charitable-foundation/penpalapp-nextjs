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

importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

const CACHE_NAME = 'offline-cache-v3';
const CACHE_PREFIX = 'offline-cache-';
const OFFLINE_URL = '/offline.html';
const ASSETS_TO_CACHE = ['/offline.html','/murphylogo.png'];

const productionFirebaseConfig = {
  apiKey: "AIzaSyBpYg-KAzwWGaT3g7J8smjnNqP8N8Nj8vQ",
  authDomain: "penpalmagicapp.firebaseapp.com",
  projectId: "penpalmagicapp",
  storageBucket: "penpalmagicapp.appspot.com",
  messagingSenderId: "45289060638",
  appId: "1:45289060638:web:33121bc47d40ceef83f10f",
  measurementId: "G-FG3MPZ8JV6",
};

const developmentFirebaseConfig = {
  apiKey: "AIzaSyDKph6qj7ojAf9pg6o0N8Lq1Zd7eUBC_YQ",
  authDomain: "penpalmagicapp-dev.firebaseapp.com",
  projectId: "penpalmagicapp-dev",
  storageBucket: "penpalmagicapp-dev.firebasestorage.app",
  messagingSenderId: "793782879682",
  appId: "1:793782879682:web:7e1ebb814edd688892025b",
  measurementId: "G-6TCJ7JEMZ0",
};

const firebaseConfig = ['localhost', '127.0.0.1', '[::1]'].includes(self.location.hostname)
  ? developmentFirebaseConfig
  : productionFirebaseConfig;

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const clickAction = payload.data?.click_action || payload.fcmOptions?.link || '/inbox';
  return self.registration.showNotification(
    payload.data?.title || 'New Conversation Message',
    {
      body: payload.data?.body || 'You have a new message.',
      data: { click_action: clickAction },
    },
  );
});

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
