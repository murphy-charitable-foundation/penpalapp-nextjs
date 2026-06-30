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

const firebaseDebugInfo = {
  mode: process.env.NODE_ENV || "unknown",
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  storageBucket: firebaseConfig.storageBucket,
  appId: firebaseConfig.appId,
  apiKeyPresent: Boolean(firebaseConfig.apiKey),
  env: {
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ? "set" : "missing",
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? "set" : "missing",
  },
};

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
let messaging;
if (typeof window !== "undefined") {
  console.info("[firebase-config]", firebaseDebugInfo);
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
