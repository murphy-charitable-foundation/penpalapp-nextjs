/**
 * Usage is commented in useAnalytics.js and donate/page.js
 */
import { getAnalytics, logEvent } from "firebase/analytics";
import { app } from "../firebaseConfig";
import * as Sentry from "@sentry/nextjs";

// Initialize Firebase Analytics
const analytics = typeof window !== "undefined" ? getAnalytics(app) : null; // Only run on the client side

// Function to track page views
/**
 * Logs page views to Firebase Analytics.
 *
 * @param {string} pagePath The path of the page.
 * @param {number} viewTime The time taken viewing the page.
 * @returns {void}
 */
const logPageView = (pagePath, viewTime) => {
  if (analytics) {
    logEvent(analytics, "page_view", {
      page_path: pagePath,
      page_title: pagePath,
      screen_time: viewTime, // seconds
    });
  }
};

/**
 * Logs button clicks to Firebase Analytics.
 *
 * @param {string} buttonName The name of the button clicked.
 * @param {string} pagePath The path of the page where the button was clicked.
 * @returns {void}
 */
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

/**
 * Logs an uncaught error to Firebase Analytics.
 *
 * @param {Error} error The error object to log.
 * @param {Object} errorInfo Additional information to include in the error event.
 * @returns {void}
 */
const logError = (error, errorInfo) => {
  const errorObject =
    error instanceof Error
      ? error
      : new Error(typeof error === "string" ? error : "Unknown error");

  if (analytics) {
    logEvent(analytics, "uncaught_error", {
      error_name: errorObject.name || "Unknown",
      error_message: errorObject.message || "No message",
      error_stack: errorObject.stack || "No stack trace",
      ...errorInfo,
    });
  }
  Sentry.captureException(errorObject);
};

/**
 * Logs a dead click event to Firebase Analytics.
 *
 * A dead click is a click that didn't result in any action, such as clicking
 * a non-interactive element or clicking outside any interactive element.
 *
 * @param {number} x The x-coordinate of the click.
 * @param {number} y The y-coordinate of the click.
 * @param {string} elementClicked The tag name of the element that was clicked.
 * @param {string} pagePath The path of the page where the click occurred.
 * @returns {void}
 */
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

/**
 * Logs the time it took for a page to load to Firebase Analytics.
 *
 * @param {string} pagePath The path of the page where the loading time occurred.
 * @param {number} loadingTime The time it took for the page to load in milliseconds.
 * @returns {void}
 */
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
