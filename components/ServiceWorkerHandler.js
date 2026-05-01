'use client';

import { useEffect } from "react";

export default function ServiceWorkerHandler() {

  useEffect(() => {
    const setupServiceWorker = async () => {
      console.log('setting up service worker...');

      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          console.log('Service Worker registered:', registration);
        } catch (err) {
          console.error('Service Worker registration failed:', err);
        }
      }
    };

    setupServiceWorker();
  }, []);

  return null;
}

