import { handleNotificationSetup } from '../firebaseConfig';
import { isServiceWorkerSupported } from './serviceWorker';

export const initializeNotifications = async () => {
  if (!isServiceWorkerSupported()) return;

  try {
    await handleNotificationSetup();
  } catch (err) {
    console.error('Notification setup failed:', err);
  }
};
