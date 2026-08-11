'use client';

import { useEffect } from "react";

export default function OfflineServiceWorkerHandler() {
  useEffect(() => {
    const setupServiceWorker = async () => {
      if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
        return;
      }

      const isLocalhost =
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname === '[::1]';

      if (isLocalhost) {
        return;
      }

      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(
          registrations.map(async (registration) => {
            const scriptURL = registration?.active?.scriptURL ?? registration?.scriptURL;
            if (scriptURL?.includes('/firebase-messaging-sw.js')) {
              await registration.unregister();
              console.log('Unregistered legacy Firebase Messaging service worker:', scriptURL);
            }
          }),
        );

        const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        console.log('Service Worker registered:', registration);
      } catch (err) {
        console.error('Service Worker registration failed:', err);
      }
    };

    setupServiceWorker();
  }, []);

  return null;
}

