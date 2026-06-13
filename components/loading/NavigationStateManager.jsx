"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import LoadingSpinner from "../loading/LoadingSpinner";

export default function NavigationStateManager() {
  // Current route and query parameters
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Controls spinner visibility
  const [showSpinner, setShowSpinner] = useState(false);

  // Tracks the current URL to detect completed navigations
  const currentUrlRef = useRef("");
  const mountedRef = useRef(false);

  // Records when navigation starts for timing calculations
  const startTimeRef = useRef(0);

  // Single timer used to control spinner visibility
  const hideTimerRef = useRef(null);

  // Timing configuration for smoother navigation UX
  const MIN_DISPLAY_TIME = 450; // Minimum spinner display time
  const POST_ROUTE_HOLD_TIME = 500; // Additional delay after route completion
  const MAX_DISPLAY_TIME = 5000; // Safety timeout to prevent stuck spinner

  // Clears any active timer before creating a new one
  const clearTimers = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  // Hides the spinner
  const hideSpinner = useCallback(() => {
    setShowSpinner(false);
  }, []);

  // Starts navigation loading state
  const startNavigation = useCallback(() => {
    clearTimers();

    startTimeRef.current = Date.now();
    setShowSpinner(true);

    // Fallback timeout in case navigation never completes
    hideTimerRef.current = setTimeout(() => {
      hideSpinner();
    }, MAX_DISPLAY_TIME);
  }, [clearTimers, hideSpinner]);

  // Completes navigation and ensures smooth spinner timing
  const finishNavigation = useCallback(() => {
    clearTimers();

    const elapsed = Date.now() - startTimeRef.current;
    const remainingMinTime = Math.max(0, MIN_DISPLAY_TIME - elapsed);

    hideTimerRef.current = setTimeout(() => {
      hideSpinner();
    }, remainingMinTime + POST_ROUTE_HOLD_TIME);
  }, [clearTimers, hideSpinner]);

  // Detects route changes and treats them as navigation completion
  useEffect(() => {
    const qs = searchParams?.toString() || "";
    const newUrl = pathname + (qs ? `?${qs}` : "");

    // Skip initial render
    if (!mountedRef.current) {
      mountedRef.current = true;
      currentUrlRef.current = newUrl;
      return;
    }

    // Route change detected
    if (newUrl !== currentUrlRef.current) {
      currentUrlRef.current = newUrl;
      finishNavigation();
    }
  }, [pathname, searchParams, finishNavigation]);

  // Handles navigation triggered by internal links
  useEffect(() => {
    const handleLinkClick = (event) => {
      const anchor = event.target.closest("a");

      if (!anchor) return;

      const href = anchor.getAttribute("href");

      if (!href) return;
      if (href.startsWith("http")) return;
      if (href.startsWith("#")) return;

      // Ignore modified clicks and new tab actions
      if (
        anchor.target === "_blank" ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const currentUrl =
        window.location.pathname + window.location.search;

      // Ignore navigation to the current page
      if (href === currentUrl || href === window.location.pathname) return;

      startNavigation();
    };

    document.addEventListener("click", handleLinkClick);

    return () => {
      document.removeEventListener("click", handleLinkClick);
    };
  }, [startNavigation]);

  // Handles browser navigation and manual navigation events
  useEffect(() => {
    const handleManualStart = () => {
      startNavigation();
    };

    const handlePopState = () => {
      startNavigation();
    };

    window.addEventListener("app:navigation-start", handleManualStart);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("app:navigation-start", handleManualStart);
      window.removeEventListener("popstate", handlePopState);
      clearTimers();
    };
  }, [startNavigation, clearTimers]);

  // Nothing to render when spinner is hidden
  if (!showSpinner) return null;

  // Render full-screen loading spinner
  return <LoadingSpinner />;
}