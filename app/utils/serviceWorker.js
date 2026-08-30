const SW_SCRIPT = '/sw.js';
const SW_SCOPE = '/';

const isServiceWorkerSupported = () =>
  typeof window !== 'undefined' && 'serviceWorker' in navigator;

// export const isLocalhost = () =>
//   typeof window !== 'undefined' &&
//   ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);

const cleanupLegacyFirebaseMessagingWorkers = async () => {
  if (!isServiceWorkerSupported()) return;

  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(
    registrations.map(async (registration) => {
      const scriptURL = registration?.active?.scriptURL ?? registration?.scriptURL;
      if (scriptURL?.includes('/firebase-messaging-sw.js')) {
        await registration.unregister();
        console.log('Unregistered legacy Firebase Messaging service worker:', scriptURL);
      }
    }),
  );
};

export const getAppServiceWorkerRegistration = async () => {
  if (!isServiceWorkerSupported()) {
    return null;
  }

  return navigator.serviceWorker.getRegistration(SW_SCOPE);
};

export const registerAppServiceWorker = async () => {
  if (!isServiceWorkerSupported()) {
    return null;
  }

  await cleanupLegacyFirebaseMessagingWorkers();
  return navigator.serviceWorker.register(SW_SCRIPT, { scope: SW_SCOPE });
};

export const getOrRegisterAppServiceWorker = async () => {
  if (!isServiceWorkerSupported()) {
    return null;
  }

  const existingRegistration = await getAppServiceWorkerRegistration();
  if (existingRegistration) return existingRegistration;

  return registerAppServiceWorker();
};
