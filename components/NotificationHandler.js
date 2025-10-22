'use client';

import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { messaging, auth } from '../app/firebaseConfig';
import { onMessage } from 'firebase/messaging'

export function NotificationHandler({ children }) {
    useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          onMessage(messaging, (payload) => {
            // handle foreground notification
            const { title, body } = payload.notification;
            new Notification(title, { body });
          });
        }
      });
      return () => {
        unsubscribe();
      };
    }, []);
  
    return children;
}
  
  