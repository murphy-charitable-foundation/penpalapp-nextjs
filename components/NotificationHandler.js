'use client';

import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { messaging, auth } from '../app/firebaseConfig';
import { onMessage } from 'firebase/messaging';

export function NotificationHandler({ children }) {
  useEffect(() => {
    let unsubscribeMessage = null;

    // Only run in browser
    if (typeof window === "undefined") return;

    const hasNotificationSupport = "Notification" in window;
    const hasMessagingSupport = !!messaging;

    // Request permission safely
    if (hasNotificationSupport && Notification.permission === "default") {
      Notification.requestPermission().catch((err) => {
        console.warn("Notification permission request failed:", err);
      });
    }

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (unsubscribeMessage) {
        unsubscribeMessage();
        unsubscribeMessage = null;
      }

      if (user && hasMessagingSupport) {
        unsubscribeMessage = onMessage(messaging, (payload) => {
          const { title, body } = payload.notification || {};

          if (!title && !body) return;

          if (hasNotificationSupport && Notification.permission === "granted") {
            new Notification(title || "New Message", { body });
          } else {
            // Fallback: in-app notification
            alert(`${title || "Notification"}\n${body || ""}`);
          }
        });
      } else if (!hasMessagingSupport) {
        console.warn("Firebase messaging not supported or not initialized.");
      }
    });

    return () => {
      if (unsubscribeMessage) unsubscribeMessage();
      unsubscribeAuth();
    };
  }, []);

  return children;
}
