'use client';

import { useEffect } from "react";

export default function OfflineServiceWorkerHandler() {

  useEffect(() => {
    const setupServiceWorker = async () => {
      console.log('setting up service worker...');

      // Only register the service worker in production to avoid intercepting
      // and caching development requests (local testing on :3000 / IP addresses)
      if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
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

