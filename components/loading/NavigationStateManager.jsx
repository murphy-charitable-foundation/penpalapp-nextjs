"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import LoadingSpinner from "../loading/LoadingSpinner";

export default function NavigationStateManager() {
  // Get current route and query params from Next.js
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Spinner visibility and exit animation state
  const [showSpinner, setShowSpinner] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // Store current URL to detect route changes
  const currentUrlRef = useRef("");
  const mountedRef = useRef(false);

  // Track navigation start time for timing control
  const startTimeRef = useRef(0);

  // Two timers only: one for controlling visibility, one for exit animation
  const hideTimerRef = useRef(null);
  const exitTimerRef = useRef(null);

  // Timing configuration for UX smoothing
  const MIN_DISPLAY_TIME = 450;       // Minimum spinner visibility
  const POST_ROUTE_HOLD_TIME = 500;   // Extra delay after route change
  const FADE_OUT_TIME = 180;          // Fade-out animation duration
  const MAX_DISPLAY_TIME = 5000;      // Safety timeout to prevent stuck spinner

  // Clear all active timers to avoid conflicts
  const clearTimers = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }

    if (exitTimerRef.current) {
      clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
  }, []);

  // Trigger fade-out animation and fully hide spinner after delay
  const hideSpinner = useCallback(() => {
    setIsExiting(true);

    exitTimerRef.current = setTimeout(() => {
      setShowSpinner(false);
      setIsExiting(false);
    }, FADE_OUT_TIME);
  }, []);

  // Called when navigation starts
  const startNavigation = useCallback(() => {
    clearTimers();

    // Record start time to control minimum display duration
    startTimeRef.current = Date.now();

    setIsExiting(false);
    setShowSpinner(true);

    // Fallback: auto-hide spinner if something goes wrong
    hideTimerRef.current = setTimeout(() => {
      hideSpinner();
    }, MAX_DISPLAY_TIME);
  }, [clearTimers, hideSpinner]);

  // Called when navigation finishes (URL actually changes)
  const finishNavigation = useCallback(() => {
    clearTimers();

    // Ensure spinner stays visible for at least MIN_DISPLAY_TIME
    const elapsed = Date.now() - startTimeRef.current;
    const remainingMinTime = Math.max(0, MIN_DISPLAY_TIME - elapsed);

    // Add extra hold time to smooth transition
    hideTimerRef.current = setTimeout(() => {
      hideSpinner();
    }, remainingMinTime + POST_ROUTE_HOLD_TIME);
  }, [clearTimers, hideSpinner]);

  // Detect route changes using pathname + query string
  useEffect(() => {
    const qs = searchParams?.toString() || "";
    const newUrl = pathname + (qs ? `?${qs}` : "");

    // Skip initial mount
    if (!mountedRef.current) {
      mountedRef.current = true;
      currentUrlRef.current = newUrl;
      return;
    }

    // If URL changed, navigation is considered finished
    if (newUrl !== currentUrlRef.current) {
      currentUrlRef.current = newUrl;
      finishNavigation();
    }
  }, [pathname, searchParams, finishNavigation]);

  // Global click listener to handle both <Link> and <a> navigation
  useEffect(() => {
    const handleLinkClick = (event) => {
      const anchor = event.target.closest("a");

      if (!anchor) return;

      const href = anchor.getAttribute("href");

      // Ignore links without href
      if (!href) return;

      // Ignore external links
      if (href.startsWith("http")) return;

      // Ignore hash-only navigation
      if (href.startsWith("#")) return;

      // Ignore modified clicks (new tab, etc.)
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

      // Ignore navigation to the same URL
      if (href === currentUrl || href === window.location.pathname) return;

      // Start spinner for valid internal navigation
      startNavigation();
    };

    document.addEventListener("click", handleLinkClick);

    return () => {
      document.removeEventListener("click", handleLinkClick);
    };
  }, [startNavigation]);

  // Handle manual navigation triggers and browser back/forward
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

  // Do not render anything if spinner is not active
  if (!showSpinner) return null;

  // Render full-screen spinner with optional exit animation
  return <LoadingSpinner exiting={isExiting} />;
}