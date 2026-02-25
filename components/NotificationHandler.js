'use client';

import { useEffect, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { onMessage } from 'firebase/messaging';
import { messaging, auth } from '../app/firebaseConfig';

export function NotificationHandler({ children }) {
  const unsubscribeMessageRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) return;
    if (!messaging) return;

    // Ask permission once
    if (Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      // Clean up old listener
      if (unsubscribeMessageRef.current) {
        unsubscribeMessageRef.current();
        unsubscribeMessageRef.current = null;
      }

      if (!user) return;

      unsubscribeMessageRef.current = onMessage(messaging, (payload) => {
        console.log('Foreground message received:', payload);
        // Firebase already shows notification automatically
      });
    });

    return () => {
      if (unsubscribeMessageRef.current) {
        unsubscribeMessageRef.current();
      }
      unsubscribeAuth();
    };
  }, []);

  return children;
}