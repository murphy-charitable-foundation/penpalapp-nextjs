import { handleNotificationSetup } from '../firebaseConfig';

export const initializeNotifications = async () => {
  console.log('[Notifications] Initializing notification flow.');
  if ('serviceWorker' in navigator) {
    try {
      await handleNotificationSetup();
      console.log('[Notifications] Notification flow finished.');
    } catch (err) {
      console.error('[Notifications] Notification flow failed:', err);
    }
  } else {
    console.error('Service Workers are not supported by this browser.');
  }
};