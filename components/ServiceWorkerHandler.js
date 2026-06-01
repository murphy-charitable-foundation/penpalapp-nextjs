'use client';

import { useEffect } from "react";

export default function ServiceWorkerHandler() {

  useEffect(() => {
    const setupServiceWorker = async () => {
      console.log('setting up service worker...');

      // Makes sure registration is only done in production; if testing in local, modify local implementation
      if ('serviceWorker' in navigator) {  // Comment only for local testing
      //if ('serviceWorker' in navigator) {     // Comment out this only for testing in local environment
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

