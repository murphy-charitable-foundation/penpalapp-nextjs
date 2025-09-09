/** Usage:
 * 
   * Firebase Analytics Documentation Example from Donate route:
   * 1. usePageAnalytics("/donate") from useAnalytics.js logs a page view for the /donate page
   * 2. The useEffect hook measures the time from when the component mounts (startTime) to when 
   *    the page is fully rendered (endTime).
   * 3. The requestAnimationFrame and setTimeout functions ensure that the endTime is recorded 
   *    after the page has finished rendering.
   * 4. The logLoadingTime function from analytics.js is called with the page path ("/donate") 
   *    and the load time, which likely sends this data to Firebase Analytics
   
  usePageAnalytics("/donate");
  useEffect(() => {
    const startTime = performance.now();
    requestAnimationFrame(() => {
      setTimeout(() => {
        const endTime = performance.now();
        const loadTime = endTime - startTime;
        console.log(`Page render time: ${loadTime}ms`);
        logLoadingTime("/donate", loadTime);
      }, 0);
    });
  }, []);

  * logButtonEvent from analytics.js logs a button click event to Firebase Analytics when the 
    "Make a Donation" button is clicked. The event is labeled as "make donation button clicked" 
    and is associated with the "/donate" page.

    <Button
    btnText="Make a Donation"
    color="bg-blue-600"
    textColor="text-white"
    hoverColor="hover:bg-blue-700"
    rounded="rounded-md"
    font="font-semibold"
    onClick={() =>
      logButtonEvent("make donation button clicked", "/donate")
    }
    />
 */
import { useEffect } from "react";
import {
  logPageView,
  logError,
  logDeadClick,
  logInternetDisconnection,
  logLoadingTime,
} from "./utils/analytics";
import { useReportWebVitals } from "next/web-vitals";

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

  /**
   * Handles logging page views, time spent on page, and dead clicks
   * @param {string} pagePath the path of the page to log
   * @returns {void}
   */
const usePageAnalytics = (pagePath) => {
  useReportWebVitals((metric) => {
    if (metric.name === "LCP") {
      logLoadingTime(pagePath, metric.value);
    }
  });
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

      /**
       * Handles logging page views. Records time spent on page and logs it.
       * @private
       * @returns {void}
       */
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
/*
This app automatically tracks and reports global (unhandled) errors and 
unhandled promise rejections. Errors are sent to both Firebase (via logError) 
and Sentry for monitoring and debugging.

Global Error Listeners are registered in GlobalTracker.addErrorListeners():
window.onerror captures uncaught JavaScript errors.
window.onunhandledrejection captures unhandled promise rejections.

When an error occurs:
The error is logged to Firebase using logError.
The error is also sent to Sentry using Sentry.captureException.
*/
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

  /**
   * Adds global error listeners to track uncaught errors and unhandled promise
   * rejections. When an error occurs, it is logged to Firebase using logError
   * which is also sent to Sentry using Sentry.captureException.
   *
   * Listeners are registered for:
   * - window.onerror: captures uncaught JavaScript errors
   * - window.onunhandledrejection: captures unhandled promise rejections
   */
  addErrorListeners() {
    // Handle regular uncaught errors
    window.onerror = (message, source, lineno, colno, error) => {
      logError(error || new Error(message), {
        type: "uncaught_error",
        source: source,
        line: lineno,
        column: colno
      });
    };

    // Handle unhandled promise rejections
    window.onunhandledrejection = (event) => {
      logError(event.reason, {
        type: "unhandled_promise_rejection",
      });
    };
  }

  /**
   * Adds listeners for online and offline events to track internet connectivity.
   * When the connection is lost, it logs the start time of the disconnection.
   * When the connection is restored, it logs the duration of the disconnection.
   */
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

  /**
   * Initializes the global error listeners and connectivity tracking.
   * This should only be called once per app lifetime.
   * @returns {void}
   */
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
