/**
 * Usage is commented in useAnalytics.js and donate/page.js
 */
import { getAnalytics, logEvent, setUserProperties } from "firebase/analytics";
import { app } from "../firebaseConfig.js";
import * as Sentry from "@sentry/nextjs";

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

const MAX_PARAM = 100; // GA4 limit for event parameter values

const truncate = (value, max = MAX_PARAM) =>
  String(value ?? "").substring(0, max);

// Next.js uses these errors for control flow (redirect()/notFound()); they are not failures.
const isControlFlowError = (error) => {
  const digest = typeof error?.digest === "string" ? error.digest : "";
  return (
    error?.message === "NEXT_REDIRECT" ||
    digest.startsWith("NEXT_REDIRECT") ||
    digest.startsWith("NEXT_NOT_FOUND") ||
    digest === "NEXT_HTTP_ERROR_FALLBACK;404"
  );
};

/**
 * Converts anything that can be thrown/reported (Error, string, ErrorEvent,
 * PromiseRejectionEvent, plain object, undefined) into an Error, and records what
 * the original value was so "Unknown error" is no longer a dead end.
 *
 * @param {*} input The reported value.
 * @returns {{ error: Error, sourceType: string, location: Object }}
 */
const normalizeError = (input) => {
  if (input instanceof Error) {
    return { error: input, sourceType: "Error", location: {} };
  }
  if (typeof input === "string") {
    return { error: new Error(input), sourceType: "string", location: {} };
  }
  if (input && typeof input === "object") {
    const sourceType = input.constructor?.name || "object";
    // ErrorEvent (worker.onerror / window.onerror) and PromiseRejectionEvent
    const inner = input.error instanceof Error ? input.error : input.reason;
    if (inner instanceof Error) {
      return { error: inner, sourceType: `${sourceType}>Error`, location: {} };
    }
    const error = new Error(
      input.message ||
        (typeof inner === "string" ? inner : "") ||
        `Non-Error ${sourceType} reported`
    );
    if (input.name && input.name !== "Error") error.name = String(input.name);
    if (input.code) error.code = input.code;
    return {
      error,
      sourceType,
      location: {
        error_file: input.filename ? String(input.filename).split("/").pop().split("?")[0] : undefined,
        error_line: input.lineno,
        error_column: input.colno,
      },
    };
  }
  return { error: new Error("Unknown error"), sourceType: typeof input, location: {} };
};

/**
 * Extracts top stack frame details from an Error stack trace string. Handles
 * V8 ("at fn (url:1:2)") and Firefox/Safari ("fn@url:1:2") formats.
 *
 * @param {string} stack The error stack trace.
 * @returns {Object} Structured stack frame metadata.
 */
const parseStackFrame = (stack) => {
  if (!stack || typeof stack !== "string") return {};

  const frameRegex =
    /(?:at\s+(?:(?<fn>[^\s(]+)\s+\()?|(?<fn2>[^\s@]*)@)(?<url>[^\s()]+?):(?<line>\d+):(?<col>\d+)\)?\s*$/;

  for (const raw of stack.split("\n")) {
    const line = raw.trim();
    if (!line || line.includes("analytics.js")) continue;
    const match = line.match(frameRegex);
    if (!match?.groups) continue;
    const { fn, fn2, url, line: ln, col } = match.groups;
    return {
      error_file: url.split("/").pop().split("?")[0],
      error_line: parseInt(ln, 10),
      error_column: parseInt(col, 10),
      error_function: fn || fn2 || "anonymous",
    };
  }
  return {};
};

// Short stable hash so identical errors group together even when the message has IDs in it.
const fingerprint = (...parts) => {
  let h = 5381;
  for (const ch of parts.join("|")) h = ((h << 5) + h + ch.charCodeAt(0)) | 0;
  return (h >>> 0).toString(36);
};

// Firebase errors carry a stable code, e.g. "auth/user-not-found" or "permission-denied".
const getErrorCode = (error) => {
  if (error?.code) return String(error.code);
  const m = /\(([a-z-]+\/[a-z0-9-]+)\)/i.exec(error?.message || "");
  return m ? m[1] : "";
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
  const { error: errorObject, sourceType, location } = normalizeError(error);

  if (isControlFlowError(errorObject)) return;

  if (process.env.NODE_ENV === "development") {
    console.error(errorObject, errorInfo);
  }

  if (analytics) {
    const { description, source, ...extra } = errorInfo || {};
    const frame = { ...parseStackFrame(errorObject.stack) };
    for (const [k, v] of Object.entries(location)) {
      if (v !== undefined && !frame[k]) frame[k] = v;
    }
    const message = errorObject.message || "No message";
    const name = errorObject.name || "Unknown";
    const pagePath = typeof window !== "undefined" ? window.location.pathname : "unknown";

    logEvent(analytics, "uncaught_error", {
      error_name: truncate(name),
      error_message: truncate(message),
      error_description: truncate(description || "none"),
      error_source: truncate(source || "handled"),
      error_source_type: truncate(sourceType),
      error_code: truncate(getErrorCode(errorObject) || "none"),
      error_file: truncate(frame.error_file || "unknown"),
      error_line: frame.error_line || 0,
      error_column: frame.error_column || 0,
      error_function: truncate(frame.error_function || "unknown"),
      error_stack: truncate(errorObject.stack || "No stack trace"),
      error_page_path: truncate(pagePath),
      error_online: typeof navigator !== "undefined" ? navigator.onLine : true,
      error_fingerprint: fingerprint(name, message.replace(/\d+/g, "#"), frame.error_file, frame.error_line),
      ...extra,
    });
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
