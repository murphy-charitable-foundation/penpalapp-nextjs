'use client';

import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { messaging, auth } from '../app/firebaseConfig';
import { onMessage } from 'firebase/messaging'

export function NotificationHandler({ children }) {
    useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          console.log("adding listener");
          onMessage(messaging, (payload) => {
            console.log('Foreground message received: ', payload);
            const { title, body } = payload.notification;
            new Notification(title, { body });
          });
        }
      });
      return () => {
        console.log("removing listener");
        unsubscribe();
      };
    }, []);
  
    return children;
}
  
  