// Import the functions you need from the SDKs you need
import { getStorage } from "@firebase/storage";
import { initializeApp } from "@firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, FieldPath } from "firebase/firestore";
import { getAnalytics, logEvent } from "firebase/analytics";

// import { getAnalytics } from "firebase/analytics";
// todo Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBpYg-KAzwWGaT3g7J8smjnNqP8N8Nj8vQ",
  authDomain: "penpalmagicapp.firebaseapp.com",
  projectId: "penpalmagicapp",
  storageBucket: "penpalmagicapp.appspot.com",
  messagingSenderId: "45289060638",
  appId: "1:45289060638:web:33121bc47d40ceef83f10f",
  measurementId: "G-FG3MPZ8JV6",
};

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app, "gs://penpalmagicapp.appspot.com/");

// Initialize Firebase Analytics
const analytics = typeof window !== "undefined" ? getAnalytics(app) : null; // Only run on the client side

// Function to track page views
const logPageView = (pagePath, viewTime) => {
  if (analytics) {
    logEvent(analytics, "page_view", {
      page_path: pagePath,
      page_title: pagePath,
      screen_time: viewTime, // seconds
    });
  }
};

const logButtonEvent = (buttonName, pagePath) => {
  if (analytics) {
    logEvent(analytics, "button_click", {
      button_name: buttonName,
      page_path: pagePath,
    });
  }
};

// status is either "success" or "failure"
const logInEvent = (status, message) => {
  if (analytics) {
    logEvent(analytics, "login", {
      status: status,
    });
  }
};

const logError = (error, errorInfo) => {
  if (analytics) {
    console.log("Logging uncaught error", error, errorInfo);
    logEvent(analytics, "uncaught_error", {
      error_name: error.name || "Unknown",
      error_message: error.message || "No message",
      error_stack: error.stack || "No stack trace",
      ...errorInfo,
    });
  }
};

const logDeadClick = (x, y, elementClicked, pagePath) => {
  if (analytics) {
    logEvent(analytics, "dead_click", {
      coordinates: `${x},${y}`,
      clicked_element: elementClicked || "unknown",
      page_path: pagePath,
      timestamp: new Date().toISOString(),
    });
  }
};

const logInternetDisconnection = (duration, reconnected = false) => {
  if (analytics) {
    logEvent(analytics, "internet_connectivity", {
      type: reconnected ? "reconnection" : "disconnection",
      duration_seconds: duration,
      timestamp: new Date().toISOString(),
    });
  }
};

const logLoadingTime = (pagePath, loadingTime) => {
  if (analytics) {
    logEvent(analytics, "page_loading_time", {
      page_path: pagePath,
      loading_time: loadingTime,
    });
  }
};

export {
  db,
  auth,
  storage,
  FieldPath,
  logPageView,
  logButtonEvent,
  logInEvent,
  logError,
  logDeadClick,
  logInternetDisconnection,
  logLoadingTime,
};

// Initialize Firebase Authentication and export
