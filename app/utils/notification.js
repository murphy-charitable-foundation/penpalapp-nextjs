import { requestForToken, requestNotificationPermission } from '../firebaseConfig';

export const initializeNotifications = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      console.log('Service Worker registered with scope:', registration.scope);

      await requestNotificationPermission();
      await requestForToken();
    } catch (err) {
      console.error('Service Worker registration failed: ', err);
    }
  } else {
    console.error('Service Workers are not supported by this browser.');
  }
};
