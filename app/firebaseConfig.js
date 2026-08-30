// Import the functions you need from the SDKs you need
import { getStorage } from "@firebase/storage";
import { initializeApp } from "@firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, FieldPath } from "firebase/firestore";
import { getMessaging, getToken, isSupported, onMessage } from "firebase/messaging";
import { doc, getDoc,setDoc, getDocs, updateDoc, query, collection, orderBy } from "firebase/firestore";
import { getOrRegisterAppServiceWorker } from "./utils/serviceWorker";
// import { getAnalytics } from "firebase/analytics";
// todo Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const productionFirebaseConfig = {
  apiKey: "AIzaSyBpYg-KAzwWGaT3g7J8smjnNqP8N8Nj8vQ",
  authDomain: "penpalmagicapp.firebaseapp.com",
  projectId: "penpalmagicapp",
  storageBucket: "penpalmagicapp.appspot.com",
  messagingSenderId: "45289060638",
  appId: "1:45289060638:web:33121bc47d40ceef83f10f",
  measurementId: "G-FG3MPZ8JV6",
};

const developmentFirebaseConfig = {
  apiKey: "AIzaSyDKph6qj7ojAf9pg6o0N8Lq1Zd7eUBC_YQ",
  authDomain: "penpalmagicapp-dev.firebaseapp.com",
  projectId: "penpalmagicapp-dev",
  storageBucket: "penpalmagicapp-dev.firebasestorage.app",
  messagingSenderId: "793782879682",
  appId: "1:793782879682:web:7e1ebb814edd688892025b",
  measurementId: "G-6TCJ7JEMZ0",
};

const firebaseConfig =
  process.env.NODE_ENV === "production"
    ? productionFirebaseConfig
    : developmentFirebaseConfig;

// // Initialize Firebase
// Only initialize if no apps have been initialized

// const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);
const VAPID_KEY =
  process.env.NODE_ENV === "production"
    ? "BL0rVqsgVKnkhFuzly4i471txifurrzYLpa2681lkzisSwfxbTf75lQ4vZTAffy_NExQBhFWr8jDupiuUT5BOsc"
    : "BHkY4hckETSNt5L7jYKcoLjgCNXmdiKcHWNvZrGXMHe06NQQ_9CDQ_XQ4bYNGUnCz9C5HvOHdJUO0LHWK7zPdaw";
let messaging = null;

const hasBasicMessagingSupportSync = () =>
  typeof window !== "undefined" &&
  typeof navigator !== "undefined" &&
  navigator.serviceWorker != null &&
  typeof navigator.serviceWorker.addEventListener === "function" &&
  "PushManager" in window;

const hasBasicMessagingSupport = async () => {
  if (!hasBasicMessagingSupportSync()) return false;

  try {
    return await isSupported();
  } catch (err) {
    console.warn("Firebase messaging support check failed:", err);
    return false;
  }
};

const initializeMessaging = async () => {
  if (messaging) {
    console.log("[Notifications] Reusing initialized Firebase Messaging instance.");
    return messaging;
  }

  if (process.env.NODE_ENV === "development") {
    console.log("Firebase client project:", firebaseConfig.projectId);
  }

  const supported = await hasBasicMessagingSupport();
  console.log("[Notifications] Firebase Messaging support check:", {
    supported,
    hasServiceWorker: typeof navigator !== "undefined" && "serviceWorker" in navigator,
    hasPushManager: typeof window !== "undefined" && "PushManager" in window,
  });
  if (!supported) return null;

  messaging = getMessaging(app);
  onMessage(messaging, async (payload) => {
    console.log("[Notifications] Foreground FCM message received:", {
      title: payload.notification?.title,
      hasBody: Boolean(payload.notification?.body),
      conversationId: payload.data?.conversationId,
    });

    if (Notification.permission !== "granted") return;

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(
        payload.notification?.title || "New Conversation Message",
        {
          body: payload.notification?.body || "You have a new message.",
          data: { click_action: payload.data?.click_action || "/inbox" },
        },
      );
    } catch (error) {
      console.error("[Notifications] Failed to display foreground FCM message:", error);
    }
  });
  console.log("[Notifications] Firebase Messaging initialized.");
  return messaging;
};

// ---------- PERMISSION + API CALL ----------

export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) {
    console.error("Notifications are not supported by this browser.");
    return null;
  }
  try {
    console.log("[Notifications] Requesting browser notification permission.");
    const permission = await Notification.requestPermission();
    console.log("[Notifications] Browser notification permission result:", permission);
    return permission;
  } catch (err) {
    console.error("Failed to request notification permission:", err);
    return null;
  }
};

export const handleNotificationSetup = async () => {
  console.log("[Notifications] Starting notification setup:", {
    permission: typeof Notification !== "undefined" ? Notification.permission : "unsupported",
    hostname: typeof window !== "undefined" ? window.location.hostname : "server",
  });
  const initializedMessaging = await initializeMessaging();

  if (!initializedMessaging) {
    console.warn("Messaging not initialized (probably server environment or unsupported browser).");
    return;
  }

  const permission =
    Notification.permission === "granted"
      ? "granted"
      : await requestNotificationPermission();

  if (permission !== "granted") {
    console.log("Notification permission denied or dismissed.");
    return;
  }

  const serviceWorkerRegistration = await getOrRegisterAppServiceWorker();
  if (!serviceWorkerRegistration) {
    console.warn('No service worker registration available for notification setup.');
    return;
  }
  console.log("[Notifications] Service worker ready:", {
    scope: serviceWorkerRegistration.scope,
    active: Boolean(serviceWorkerRegistration.active),
    installing: Boolean(serviceWorkerRegistration.installing),
    waiting: Boolean(serviceWorkerRegistration.waiting),
  });

  try {
    const token = await getToken(initializedMessaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration,
    });
    const user = auth.currentUser;
    console.log("[Notifications] FCM token request completed:", {
      hasToken: Boolean(token),
      tokenLength: token?.length ?? 0,
      authenticatedUid: user?.uid ?? null,
    });

    if (!token || !user) {
      console.warn("Missing FCM token or no authenticated user.");
      return;
    }

    const idToken = await user.getIdToken();
    const res = await fetch("/api/setupNotifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken, fcmToken: token }),
    });

    const data = await res.json();
    if (res.ok) {
      console.log("[Notifications] Notification setup API succeeded:", {
        status: res.status,
        response: data,
      });
    } else {
      console.error("[Notifications] Notification setup API failed:", {
        status: res.status,
        response: data,
      });
    }
  } catch (err) {
    console.error("Error during notification setup:", err);
  }
};

export { db, auth, storage, FieldPath, app, messaging };
