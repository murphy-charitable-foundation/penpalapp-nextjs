/** Usage:
 * 
   * Firebase Analytics Documentation Example from Donate route:
   * usePageAnalytics("/donate") from useAnalytics.js logs dead clicks and load times for the /donate page
   
  usePageAnalytics("/donate");

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
import { ref, getDownloadURL, uploadString } from "@firebase/storage";
import { storage } from "./firebaseConfig";

async function uploadScreenshot(base64Image, fileName) {
  const storageRef = ref(storage, `deadclicks/${fileName}.png`);
  await uploadString(storageRef, base64Image, "data_url");
  return await getDownloadURL(storageRef);
}

const captureClickArea = async function(normalizedX, normalizedY, radius = 300) {
  if (typeof window !== "undefined") {
    const html2canvas = (await import("html2canvas")).default;
    // Render the full document body
    const canvas = await html2canvas(document.body);
    const renderedWidth = canvas.width;
    const renderedHeight = canvas.height;

    // Convert normalized coordinates to actual pixel positions in the rendered canvas
    const centerX = Math.round(normalizedX * renderedWidth);
    const centerY = Math.round(normalizedY * renderedHeight);

    // Crop a region around the click
    const croppedCanvas = document.createElement("canvas");
    croppedCanvas.width = radius * 2;
    croppedCanvas.height = radius * 2;
    const croppedCtx = croppedCanvas.getContext("2d");
    croppedCtx.drawImage(
      canvas,
      centerX - radius, centerY - radius, radius * 2, radius * 2, // source area
      0, 0, radius * 2, radius * 2                                // destination
    );

    // Draw a circle around the click point
    const circleRadius = Math.min(radius / 5, 20);  // e.g. circle radius = 1/5 of crop radius, but max 20px
    
    croppedCtx.beginPath();
    croppedCtx.arc(radius, radius, circleRadius, 0, 2 * Math.PI, false);
    croppedCtx.fillStyle = "rgba(255, 255, 0, 0.8)";  // semi-opaque yellow
    croppedCtx.fill();

    return croppedCanvas.toDataURL("image/png");
  }
  return null;
}

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

      const throttledDeadClickHandler = throttle(async (e) => {
        if (nonInteractiveElements.includes(e.target.tagName)) {
          // Normalize coordinates to viewport and incorporate scroll
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;
          const normalizedX = (e.clientX + window.scrollX) / viewportWidth;
          const normalizedY = (e.clientY + window.scrollY) / viewportHeight;

          const screenshot = await captureClickArea(normalizedX, normalizedY);
          // Use a UUID for the filename
          const fileName = `${crypto.randomUUID()}`;
          const screenshotUrl = await uploadScreenshot(screenshot, fileName);
          logDeadClick(
            e.target.tagName,
            window.location.pathname,
            fileName,
            e.target.id,
            e.target.getAttribute("aria-label")
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
