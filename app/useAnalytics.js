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
import { ref, uploadString } from "@firebase/storage";
import { storage } from "./firebaseConfig";

const DEAD_CLICK_RULESET_ID = "deadclick-v2.0";
const RAPID_REPEAT_THRESHOLD_MS = 300;
const REPEAT_WINDOW_MS = 2000;
const OBSERVATION_WINDOW_MS = 1200;
const T1_WINDOW_MS = 150;
const DEAD_CLICK_SCORE_THRESHOLD = 45;
const NON_ACTIONABLE_DEAD_CLICK_SCORE_THRESHOLD = 35;

let networkTrackerInstalled = false;
let recentNetworkRequests = [];

function trackNetworkRequestStart() {
  const now = Date.now();
  recentNetworkRequests.push(now);
  recentNetworkRequests = recentNetworkRequests.filter(
    (ts) => now - ts <= OBSERVATION_WINDOW_MS
  );
}

function installNetworkTracker() {
  if (networkTrackerInstalled || typeof window === "undefined") {
    return;
  }

  networkTrackerInstalled = true;

  const originalFetch = window.fetch?.bind(window);
  if (originalFetch) {
    window.fetch = (...args) => {
      trackNetworkRequestStart();
      return originalFetch(...args);
    };
  }

  const originalXhrSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function patchedSend(...args) {
    trackNetworkRequestStart();
    return originalXhrSend.apply(this, args);
  };
}

function getTargetElement(eventTarget) {
  return eventTarget instanceof Element ? eventTarget : null;
}

function hasPointerEventsNoneAncestor(target) {
  let node = target;
  while (node && node instanceof Element) {
    if (window.getComputedStyle(node).pointerEvents === "none") {
      return true;
    }
    node = node.parentElement;
  }
  return false;
}

function hasDisabledAncestor(target) {
  const disabledControl = target.closest(
    "button:disabled,input:disabled,select:disabled,textarea:disabled,option:disabled,fieldset:disabled"
  );
  if (disabledControl) {
    return true;
  }

  const ariaDisabled = target.closest('[aria-disabled="true"]');
  return Boolean(ariaDisabled);
}

function isVisibleAndEnabled(target) {
  const rect = target.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) {
    return false;
  }

  const style = window.getComputedStyle(target);
  if (
    style.display === "none" ||
    style.visibility === "hidden" ||
    style.opacity === "0"
  ) {
    return false;
  }

  if (hasDisabledAncestor(target) || hasPointerEventsNoneAncestor(target)) {
    return false;
  }

  return true;
}

function isActionableElement(target) {
  const actionableSelector = [
    "button",
    '[role="button"]',
    "a[href]",
    "input:not([type='hidden'])",
    "select",
    "textarea",
    "summary",
    "label[for]",
    "[aria-controls]",
    "[aria-expanded]",
    "[data-action]",
    "[data-testid]",
  ].join(",");

  return Boolean(target.closest(actionableSelector));
}

function isNavigationOrMenuInteraction(target) {
  return Boolean(
    target.closest(
      "[role='menubar'],[role='menu'],[role='menuitem'],[aria-haspopup='menu'],[data-menu-trigger],[data-dropdown-trigger],[data-menu],.dropdown-menu,.menu-dropdown"
    )
  );
}

function hasExpectedBrowserHandledBehavior(target) {
  const anchor = target.closest("a[href]");
  if (anchor && !anchor.hasAttribute("download")) {
    return true;
  }

  const submitter = target.closest("button[type='submit'],input[type='submit']");
  if (submitter) {
    return true;
  }

  const inputFocusTarget = target.closest("input,textarea,select,[contenteditable='true']");
  if (inputFocusTarget) {
    return true;
  }

  return false;
}

function getTargetFingerprint(target) {
  const role = target.getAttribute("role") || "none";
  const id = target.id || "no-id";
  const tag = target.tagName || "UNKNOWN";
  const testId = target.getAttribute("data-testid") || "no-testid";
  return `${tag}|${role}|${id}|${testId}`;
}

function isScrollbarOrViewportEdgeClick(event) {
  const docWidth = document.documentElement.clientWidth;
  const docHeight = document.documentElement.clientHeight;
  const scrollbarWidth = Math.max(0, window.innerWidth - docWidth);
  const scrollbarHeight = Math.max(0, window.innerHeight - docHeight);
  const edgeThreshold = 2;

  const onVerticalScrollbar =
    scrollbarWidth > 0 && event.clientX >= docWidth - edgeThreshold;
  const onHorizontalScrollbar =
    scrollbarHeight > 0 && event.clientY >= docHeight - edgeThreshold;

  const onViewportEdge =
    event.clientX <= edgeThreshold ||
    event.clientY <= edgeThreshold ||
    event.clientX >= window.innerWidth - edgeThreshold ||
    event.clientY >= window.innerHeight - edgeThreshold;

  return onVerticalScrollbar || onHorizontalScrollbar || onViewportEdge;
}

function hasLoadingIndicators() {
  return Boolean(
    document.querySelector(
      '[aria-busy="true"], .loading, .spinner, .skeleton, [data-loading="true"]'
    )
  );
}

function distanceBetweenRects(rectA, rectB) {
  const aX = rectA.left + rectA.width / 2;
  const aY = rectA.top + rectA.height / 2;
  const bX = rectB.left + rectB.width / 2;
  const bY = rectB.top + rectB.height / 2;
  return Math.hypot(aX - bX, aY - bY);
}

function hasExpectedAsyncUiIndicator() {
  return Boolean(
    document.querySelector(
      '[aria-busy="true"], .spinner, .loading, .toast, [role="alert"], [role="dialog"], [data-state="open"], [data-open="true"]'
    )
  );
}

function computeDeadnessScore({
  hasOutcome,
  repeatClicks,
  isSemanticAction,
  isTinyTarget,
  signals,
  hasKnownBenignClass,
}) {
  let score = 0;

  if (!hasOutcome) {
    score += 35;
  }
  if (repeatClicks > 1) {
    score += 20;
  }
  if (isSemanticAction) {
    score += 15;
  }
  if (isTinyTarget) {
    score += 10;
  }
  if (signals.networkRequestStarted) {
    score -= 25;
  }
  if (signals.routeTransitionObserved) {
    score -= 20;
  }
  if (signals.stateMutationNearTarget && isSemanticAction) {
    score -= 20;
  }
  if (hasKnownBenignClass) {
    score -= 15;
  }

  return Math.max(0, Math.min(100, score));
}

async function uploadScreenshot(base64Image, fileName) {
  console.log("Uploading screenshot to Firebase Storage:", fileName);
  const storageRef = ref(storage, `analytics/deadclicks/${fileName}.png`);
  return await uploadString(storageRef, base64Image, "data_url");
}

// Generate a RFC4122-compliant UUID safely across older browsers.
function fallbackRandomUUID() {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch (e) {
    // fall through to Math.random fallback
  }

  // Non-crypto fallback (best-effort)
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
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
      installNetworkTracker();

      const clickHistory = new Map();
      let lastPointerDown = null;

      const handlePointerDown = (e) => {
        if (!(e instanceof PointerEvent)) {
          return;
        }
        lastPointerDown = {
          x: e.clientX,
          y: e.clientY,
          time: Date.now(),
        };
      };

      const deadClickHandler = async (e) => {
        const target = getTargetElement(e.target);
        if (!target) {
          return;
        }

        const now = Date.now();

        // Strict eligibility rules
        if (!e.isTrusted) {
          return;
        }
        if (typeof e.button === "number" && e.button !== 0) {
          return;
        }
        if (e.detail === 0) {
          return;
        }
        if (!isVisibleAndEnabled(target)) {
          return;
        }
        if (hasExpectedBrowserHandledBehavior(target)) {
          return;
        }

        // Benign suppressions
        if (isNavigationOrMenuInteraction(target)) {
          return;
        }
        if (isScrollbarOrViewportEdgeClick(e)) {
          return;
        }
        if (hasLoadingIndicators()) {
          return;
        }
        if (hasDisabledAncestor(target) || hasPointerEventsNoneAncestor(target)) {
          return;
        }

        const fingerprint = getTargetFingerprint(target);
        const existingHistory = clickHistory.get(fingerprint) || [];
        const recentHistory = existingHistory.filter((ts) => now - ts <= REPEAT_WINDOW_MS);
        recentHistory.push(now);
        clickHistory.set(fingerprint, recentHistory);

        const rapidRepeat =
          recentHistory.length > 1 && now - recentHistory[recentHistory.length - 2] <= RAPID_REPEAT_THRESHOLD_MS;
        if (rapidRepeat) {
          return;
        }

        if (lastPointerDown && now - lastPointerDown.time <= 1200) {
          const moveDistance = Math.hypot(
            e.clientX - lastPointerDown.x,
            e.clientY - lastPointerDown.y
          );
          if (moveDistance > 8) {
            return;
          }
        }

        const selectedText = window.getSelection?.()?.toString().trim();
        if (selectedText) {
          return;
        }

        const clickTs = now;
        const initialPath = `${window.location.pathname}${window.location.search}`;
        const targetRect = target.getBoundingClientRect();

        const signals = {
          routeTransitionStarted: false,
          routeTransitionObserved: false,
          stateMutationNearTarget: false,
          focusChangeExpectedNode: false,
          networkRequestStarted: false,
          routeCompleted: false,
          uiOpenSignal: false,
          optimisticUpdateSignal: false,
        };

        let suppressed = false;
        const mutationObserver = new MutationObserver((mutations) => {
          const elapsed = Date.now() - clickTs;
          for (const mutation of mutations) {
            const mutationTarget = mutation.target instanceof Element ? mutation.target : null;
            if (!mutationTarget) {
              continue;
            }

            const isClassOrStateMutation =
              mutation.type === "attributes" &&
              ["class", "aria-expanded", "aria-pressed", "aria-selected", "disabled"].includes(mutation.attributeName);

            const targetRelated =
              mutationTarget === target ||
              target.contains(mutationTarget) ||
              mutationTarget.contains(target);

            const nearTarget =
              targetRelated ||
              distanceBetweenRects(mutationTarget.getBoundingClientRect(), targetRect) <= 200;

            if (nearTarget && isClassOrStateMutation) {
              signals.stateMutationNearTarget = true;
              if (elapsed <= T1_WINDOW_MS) {
                signals.routeTransitionStarted = true;
              }
            }

            if (
              mutation.type === "childList" &&
              (mutationTarget.matches?.("[role='dialog'],[role='alert'],.toast,.modal,[data-open='true']") ||
                mutationTarget.querySelector?.("[role='dialog'],[role='alert'],.toast,.modal,[data-open='true']"))
            ) {
              signals.uiOpenSignal = true;
            }
          }
        });

        const handleFocusIn = (focusEvent) => {
          const focusTarget = getTargetElement(focusEvent.target);
          if (!focusTarget) {
            return;
          }

          if (
            focusTarget === target ||
            target.contains(focusTarget) ||
            focusTarget.matches("input,textarea,select,[contenteditable='true']")
          ) {
            signals.focusChangeExpectedNode = true;
          }
        };

        const checkPathChange = () => {
          const currentPath = `${window.location.pathname}${window.location.search}`;
          if (currentPath !== initialPath) {
            signals.routeTransitionStarted = true;
            signals.routeTransitionObserved = true;
            signals.routeCompleted = true;
          }
        };

        document.addEventListener("focusin", handleFocusIn, true);
        mutationObserver.observe(document.body, {
          subtree: true,
          childList: true,
          attributes: true,
          attributeFilter: [
            "class",
            "aria-expanded",
            "aria-pressed",
            "aria-selected",
            "disabled",
          ],
        });

        const t1Timer = setTimeout(checkPathChange, T1_WINDOW_MS);

        await new Promise((resolve) => {
          setTimeout(resolve, OBSERVATION_WINDOW_MS);
        });

        checkPathChange();
        signals.networkRequestStarted = recentNetworkRequests.some(
          (ts) => ts >= clickTs && ts - clickTs <= OBSERVATION_WINDOW_MS
        );
        signals.optimisticUpdateSignal = signals.stateMutationNearTarget;

        if (hasExpectedAsyncUiIndicator()) {
          suppressed = true;
        }

        clearTimeout(t1Timer);
        mutationObserver.disconnect();
        document.removeEventListener("focusin", handleFocusIn, true);

        if (suppressed) {
          return;
        }

        const clickableRole =
          target.matches("button,[role='button'],a[href]") ||
          Boolean(target.closest("button,[role='button'],a[href]"));

        const hasOutcome =
          signals.routeTransitionStarted ||
          signals.networkRequestStarted ||
          signals.routeCompleted ||
          signals.uiOpenSignal ||
          (clickableRole &&
            (signals.stateMutationNearTarget ||
              signals.focusChangeExpectedNode ||
              signals.optimisticUpdateSignal));

        const isTinyTarget = targetRect.width < 24 || targetRect.height < 24;
        const hasKnownBenignClass = Boolean(
          target.closest(".tooltip,.carousel,.drag-handle,[data-benign-click='true']")
        );

        const deadnessScore = computeDeadnessScore({
          hasOutcome,
          repeatClicks: recentHistory.length,
          isSemanticAction: clickableRole,
          isTinyTarget,
          signals,
          hasKnownBenignClass,
        });

        const scoreThreshold = clickableRole
          ? DEAD_CLICK_SCORE_THRESHOLD
          : NON_ACTIONABLE_DEAD_CLICK_SCORE_THRESHOLD;

        if (deadnessScore < scoreThreshold) {
          return;
        }

        // Normalize coordinates to viewport and incorporate scroll
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const normalizedX = (e.clientX + window.scrollX) / viewportWidth;
        const normalizedY = (e.clientY + window.scrollY) / viewportHeight;

        const screenshot = await captureClickArea(normalizedX, normalizedY);
        const fileName = fallbackRandomUUID();
        await uploadScreenshot(screenshot, fileName);

        logDeadClick(
          target.tagName,
          window.location.pathname,
          fileName,
          target.id,
          target.getAttribute("aria-label"),
          {
            deadness_score: deadnessScore,
            ruleset_id: DEAD_CLICK_RULESET_ID,
            outcome_present: hasOutcome,
            network_signal: signals.networkRequestStarted,
            route_signal: signals.routeTransitionObserved,
            mutation_signal: signals.stateMutationNearTarget,
          }
        );
      };

      document.addEventListener("pointerdown", handlePointerDown, true);
      document.addEventListener("click", deadClickHandler, true);

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
        document.removeEventListener("pointerdown", handlePointerDown, true);
        document.removeEventListener("click", deadClickHandler, true);
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
