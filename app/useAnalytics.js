import { useEffect } from "react";
import {
  logPageView,
  logError,
  logDeadClick,
  logInternetDisconnection,
} from "@/app/utils/analytics";
import * as Sentry from "@sentry/nextjs";

// Throttle function to limit the rate at which a function can fire
const throttle = (func, limit) => {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

const usePageAnalytics = (pagePath) => {
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Log dead clicks
      const nonInteractiveElements = [
        "P",
        "DIV",
        "H1",
        "H2",
        "H3",
        "H4",
        "H5",
        "H6",
        "IMG",
      ];

      const throttledDeadClickHandler = throttle((e) => {
        if (nonInteractiveElements.includes(e.target.tagName)) {
          console.log("dead click");
          logDeadClick(
            e.clientX,
            e.clientY,
            e.target.tagName,
            window.location.pathname
          );
        }
      }, 500);

      document.addEventListener("click", throttledDeadClickHandler);

      // Log page views and time spent on page
      let startTime = Date.now();

      const handlePageView = () => {
        const viewTime = Math.round((Date.now() - startTime) / 1000); // Convert to seconds
        if (viewTime > 0) {
          logPageView(pagePath, viewTime);
        }
      };

      if (document.readyState === "complete") {
        startTime = Date.now();
      } else {
        window.addEventListener("load", () => {
          startTime = Date.now();
        });
      }

      // handle page visibility change (switch tabs or minimize browser)
      const handleVisibilityChange = () => {
        if (document.visibilityState === "hidden") {
          handlePageView();
        } else if (document.visibilityState === "visible") {
          startTime = Date.now(); // reset timer
        }
      };

      // handle page close or redirect
      window.addEventListener("beforeunload", handlePageView);
      // handle page visibility change
      document.addEventListener("visibilitychange", handleVisibilityChange);

      // cleanup function: handle component unmount (route change) and page close
      return () => {
        handlePageView(); // record time when component unmounts
        window.removeEventListener("beforeunload", handlePageView);
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange
        );
        document.removeEventListener("click", throttledDeadClickHandler);
      };
    }
  }, [pagePath]);
};

// Track the uncaught errors
class GlobalTracker {
  static instance = null;
  isInitialized = false;
  disconnectionStartTime = null;

  constructor() {
    if (GlobalTracker.instance) {
      return GlobalTracker.instance;
    }
    GlobalTracker.instance = this;
  }

  addErrorListeners() {
    // Handle regular uncaught errors
    window.onerror = (message, source, lineno, colno, error) => {
      logError(error || new Error(message), {
        type: "uncaught_error",
        source: source,
        line: lineno,
        column: colno,
      });
      Sentry.captureException(error || new Error(message)); // Send to Sentry
    };

    // Handle unhandled promise rejections
    window.onunhandledrejection = (event) => {
      logError(event.reason, {
        type: "unhandled_promise_rejection",
      });
      Sentry.captureException(event.reason); // Send to Sentry
    };
  }

  initializeConnectivityTracking() {
    window.addEventListener("online", () => {
      if (this.disconnectionStartTime) {
        const duration = Math.round(
          (Date.now() - this.disconnectionStartTime) / 1000
        );
        console.log("internet disconnection duration:", duration);
        logInternetDisconnection(duration, true);
        this.disconnectionStartTime = null;
      }
    });

    window.addEventListener("offline", () => {
      this.disconnectionStartTime = Date.now();
      logInternetDisconnection(0, false);
    });
  }

  initialize() {
    if (typeof window !== "undefined" && !this.isInitialized) {
      this.addErrorListeners();
      this.initializeConnectivityTracking();
      this.isInitialized = true;
    }
  }
}

const globalTracker = new GlobalTracker();
globalTracker.initialize();

export { usePageAnalytics, globalTracker };
