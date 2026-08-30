import { handleNotificationSetup } from '../firebaseConfig';

export const initializeNotifications = async () => {
  if ('serviceWorker' in navigator) {
    try {
      await handleNotificationSetup();
    } catch (err) {
      console.error('Service Worker registration failed: ', err);
    }
  } else {
    console.error('Service Workers are not supported by this browser.');
  }
};