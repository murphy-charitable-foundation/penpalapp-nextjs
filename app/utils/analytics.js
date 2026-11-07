/**
 * Usage is commented in useAnalytics.js and donate/page.js
 */
import { getAnalytics, logEvent, setUserProperties } from "firebase/analytics";
import { app } from "../firebaseConfig.js";
import { buildErrorEvent, normalizeError } from "./errorEvent.mjs";

// Initialize Firebase Analytics
const analytics = typeof window !== "undefined" ? getAnalytics(app) : null; // Only run on the client side

const setAnalyticsUserType = (userType) => {
  if (analytics && userType) {
    setUserProperties(analytics, {
      user_type: userType,
    });
  }
};

const logDormantMessageSent = (reason, userUid) => {
  if (analytics) {
    logEvent(analytics, "dormant_message_sent", {
      dormant_conversation_reason: reason || "unknown",
      dormant_conversation_user_uid: userUid || "unknown",
    });
  }
};

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
      page_screen_time: viewTime, // seconds
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
const logInEvent = (status) => {
  if (analytics) {
    logEvent(analytics, "login", {
      status: status,
    });
  }
};

/**
 * Logs an error to Firebase Analytics as an "uncaught_error" event.
 *
 * errorInfo.description is sent as error_description (what the app was doing).
 * errorInfo.source is sent as error_source (e.g. "window.onerror",
 * "unhandled_rejection", "web_worker", "react_boundary"); handled errors default to "handled".
 * Any other keys are passed through unchanged.
 *
 * @param {*} error The error (or anything thrown) to log.
 * @param {Object} errorInfo Additional information to include in the error event.
 * @returns {void}
 */
const logError = (error, errorInfo = {}) => {
  const pagePath = typeof window !== "undefined" ? window.location.pathname : "unknown";
  const event = buildErrorEvent(error, errorInfo, pagePath);
  if (!event) return;

  if (process.env.NODE_ENV === "development") {
    console.error(normalizeError(error).error, errorInfo);
  }

  if (analytics) {
    logEvent(analytics, "uncaught_error", event);
  }
};

/**
 * Logs a dead click event to Firebase Analytics.
 *
 * This function is used to track clicks that don't result in any action, such as clicking a non-interactive element or clicking outside any interactive element.
 *
 * @param {string} elementClicked The tag name of the element that was clicked. If not provided, the value will be set to "unknown".
 * @param {string} pagePath The path of the page where the click occurred.
 * @param {string} screenshotUrl The URL of the screenshot of the page where the click occurred. If not provided, the value will be set to null.
 * @param {string} elementId The ID of the element that was clicked. If not provided, the value will be set to "unknown".
 * @param {string} ariaLabel The ARIA label of the element that was clicked. If not provided, the value will be set to "unknown".
 * @param {Object} meta Optional dead-click metadata (score and rule outcomes).
 * @returns {void}
 */
const logDeadClick = (
  elementClicked,
  pagePath,
  screenshotUrl,
  elementId,
  ariaLabel,
  meta = {}
) => {
  if (analytics) {
    //console.log("Logging dead click event");
    logEvent(analytics, "dead_click", {
      page_path: pagePath,
      dead_clicked_element: elementClicked || "unknown",
      dead_click_screenshot_url: screenshotUrl || null,
      dead_click_element_id: elementId || "unknown",
      dead_click_aria_label: ariaLabel || "unknown",
      ...meta,
    });
  }
};

const logInternetOffline = (duration) => {
  if (analytics) {
    logEvent(analytics, "internet_offline", {
      offline_duration_seconds: duration,
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
      page_loading_time: loadingTime,
    });
  }
};

export {
  setAnalyticsUserType,
  logDormantMessageSent,
  logPageView,
  logButtonEvent,
  logInEvent,
  logError,
  logDeadClick,
  logInternetOffline,
  logLoadingTime,
};
