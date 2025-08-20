import { getAnalytics, logEvent } from "firebase/analytics";
import { app } from "../firebaseConfig";

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
  logPageView,
  logButtonEvent,
  logInEvent,
  logError,
  logDeadClick,
  logInternetDisconnection,
  logLoadingTime,
};
