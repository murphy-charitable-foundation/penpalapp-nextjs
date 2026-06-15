// Import the functions you need from the SDKs you need
import { getStorage } from "@firebase/storage";
import { initializeApp } from "@firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, FieldPath } from "firebase/firestore";
import { getMessaging, getToken } from "firebase/messaging";
import { doc, getDoc,setDoc, getDocs, updateDoc, query, collection, orderBy } from "firebase/firestore"

// import { getAnalytics } from "firebase/analytics";
// todo Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const parseFirebaseWebAppConfig = () => {
  const rawConfig =
    process.env.NEXT_PUBLIC_FIREBASE_WEBAPP_CONFIG ||
    process.env.FIREBASE_WEBAPP_CONFIG;

  if (!rawConfig) return null;

  try {
    return JSON.parse(rawConfig);
  } catch (error) {
    console.error("Invalid Firebase web app config JSON:", error);
    return null;
  }
};

const envFirebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const hasEnvFirebaseConfig = Boolean(
  envFirebaseConfig.apiKey &&
    envFirebaseConfig.authDomain &&
    envFirebaseConfig.projectId &&
    envFirebaseConfig.storageBucket &&
    envFirebaseConfig.messagingSenderId &&
    envFirebaseConfig.appId
);

const firebaseConfig =
  parseFirebaseWebAppConfig() ||
  (hasEnvFirebaseConfig ? envFirebaseConfig : null);

if (!firebaseConfig) {
  throw new Error(
    "Firebase client config is missing. Set FIREBASE_WEBAPP_CONFIG or NEXT_PUBLIC_FIREBASE_* environment variables.",
  );
}

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
  process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ||
  "BL0rVqsgVKnkhFuzly4i471txifurrzYLpa2681lkzisSwfxbTf75lQ4vZTAffy_NExQBhFWr8jDupiuUT5BOsc";
let messaging;
if (typeof window !== "undefined") {
  if (process.env.NODE_ENV === "development") {
    console.log("Firebase client project:", firebaseConfig.projectId);
  }
  messaging = getMessaging(app);
}

// ---------- PERMISSION + API CALL ----------

export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) {
    console.error("Notifications are not supported by this browser.");
    return null;
  }
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.error("Failed to request notification permission:", err);
    return null;
  }
};

export const handleNotificationSetup = async () => {
  if (!messaging) {
    console.warn("Messaging not initialized (probably server environment).");
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

  try {
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    const user = auth.currentUser;

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
      console.log("Notification setup complete:");
    } else {
      console.error("Server error setting up notifications:");
    }
  } catch (err) {
    console.error("Error during notification setup:", err);
  }
};

export { db, auth, storage, FieldPath, app, messaging };
