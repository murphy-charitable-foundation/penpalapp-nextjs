'use client';

import { useEffect, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { messaging, auth } from '../app/firebaseConfig';
import { onMessage } from 'firebase/messaging';

export function NotificationHandler({ children }) {
  const messageListenerRef = useRef(null);
  const lastMessageIdRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const hasNotificationSupport = "Notification" in window;
    const hasMessagingSupport = !!messaging;

    if (hasNotificationSupport && Notification.permission === "default") {
      Notification.requestPermission().catch((err) => {
        console.warn("Notification permission request failed:", err);
      });
    }

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (messageListenerRef.current) {
        messageListenerRef.current();
        messageListenerRef.current = null;
      }

      if (user && hasMessagingSupport) {
        messageListenerRef.current = onMessage(messaging, (payload) => {
          if (payload?.messageId === lastMessageIdRef.current) return;
          lastMessageIdRef.current = payload?.messageId;

          const { title, body } = payload.notification || {};
          if (!title && !body) return;

          if (hasNotificationSupport && Notification.permission === "granted") {
            new Notification(title, { body });
          } else {
            alert(`${title || "Notification"}\n${body || ""}`);
          }
        });
      }
    });

    return () => {
      if (messageListenerRef.current) {
        messageListenerRef.current();
      }
      unsubscribeAuth();
    };
  }, []);

  return children;
}