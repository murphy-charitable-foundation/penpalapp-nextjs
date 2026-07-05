"use client";

import { useEffect } from 'react';
import { messaging } from '../app/firebaseConfig';

export function NotificationHandler({ children }) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) return;
    if (!messaging) return;
    if (!('serviceWorker' in navigator)) return;

    if (Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  return children;
}