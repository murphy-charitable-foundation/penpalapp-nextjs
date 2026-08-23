'use client';

import { useEffect } from "react";
import { registerAppServiceWorker } from '../app/utils/serviceWorker';

export default function OfflineServiceWorkerHandler() {
  useEffect(() => {
    const setupServiceWorker = async () => {
      try {
        await registerAppServiceWorker();
      } catch (err) {
        console.error('Service Worker registration failed:', err);
      }
    };

    setupServiceWorker();
  }, []);

  return null;
}

