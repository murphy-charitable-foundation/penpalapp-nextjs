"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import LoadingSpinner from "../loading/LoadingSpinner";

export default function NavigationStateManager() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [showSpinner, setShowSpinner] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // Stores the current URL (path + query)
  const currentUrlRef = useRef("");

  // Tracks whether a navigation has started
  const navigationStartedRef = useRef(false);

  // Stores navigation start time
  const startTimeRef = useRef(0);

  // Used to skip logic on initial mount
  const mountedRef = useRef(false);

  // Timer references for controlling spinner behavior
  const minTimerRef = useRef(null);
  const exitTimerRef = useRef(null);
  const safetyTimerRef = useRef(null);

  // Minimum time the spinner should stay visible
  const MIN_DISPLAY_TIME = 600;

  // Duration of exit animation
  const FADE_OUT_TIME = 200;

  // Fallback timeout in case navigation never finishes
  const MAX_WAIT_TIME = 4000;

  // Clear all active timers
  const clearTimers = useCallback(() => {
    if (minTimerRef.current) {
      clearTimeout(minTimerRef.current);
      minTimerRef.current = null;
    }

    if (exitTimerRef.current) {
      clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }

    if (safetyTimerRef.current) {
      clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
    }
  }, []);

  // Reset spinner state and navigation tracking
  const reset = useCallback(() => {
    clearTimers();
    navigationStartedRef.current = false;
    startTimeRef.current = 0;
    setShowSpinner(false);
    setIsExiting(false);
  }, [clearTimers]);

  // Triggered when navigation starts
  const startNavigation = useCallback(() => {
    // Prevent duplicate triggers
    if (navigationStartedRef.current) return;

    navigationStartedRef.current = true;
    startTimeRef.current = Date.now();

    setIsExiting(false);
    setShowSpinner(true);

    // Safety timeout in case finishNavigation is never called
    safetyTimerRef.current = setTimeout(() => {
      reset();
    }, MAX_WAIT_TIME);
  }, [reset]);

  // Triggered when navigation finishes (route change detected)
  const finishNavigation = useCallback(() => {
    if (!navigationStartedRef.current) return;

    const elapsed = Date.now() - startTimeRef.current;

    // Ensure spinner stays visible for at least MIN_DISPLAY_TIME
    const remaining = Math.max(0, MIN_DISPLAY_TIME - elapsed);

    minTimerRef.current = setTimeout(() => {
      setIsExiting(true);

      // Allow exit animation before fully hiding spinner
      exitTimerRef.current = setTimeout(() => {
        reset();
      }, FADE_OUT_TIME);
    }, remaining);
  }, [reset]);

  // Track route changes and mark navigation as finished
  useEffect(() => {
    const qs = searchParams?.toString?.() || "";
    currentUrlRef.current = pathname + (qs ? `?${qs}` : "");

    // Skip first render
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }

    finishNavigation();
  }, [pathname, searchParams, finishNavigation]);

  useEffect(() => {
    // Detect clicks on <a> (including Next.js Link)
    const handleClick = (e) => {
      const link = e.target.closest?.("a");
      if (!link) return;

      // Ignore modified clicks or non-navigation cases
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        link.target === "_blank" ||
        link.hasAttribute("download") ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }

      const href = link.getAttribute("href");
      if (!href || href.startsWith("#")) return;

      let nextUrl;
      try {
        nextUrl = new URL(link.href, window.location.origin);
      } catch {
        return;
      }

      // Ignore external links
      if (nextUrl.origin !== window.location.origin) return;

      const nextPath = nextUrl.pathname + nextUrl.search;

      // Only trigger navigation if URL actually changes
      if (nextPath !== currentUrlRef.current) {
        startNavigation();
      }
    };

    // Handle browser back/forward navigation
    const handlePopState = () => {
      startNavigation();
    };

    // Handle manual navigation (e.g., router.push via custom hook)
    const handleManualStart = () => {
      startNavigation();
    };

    document.addEventListener("click", handleClick, true);
    window.addEventListener("popstate", handlePopState);
    window.addEventListener("app:navigation-start", handleManualStart);

    return () => {
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("app:navigation-start", handleManualStart);
      clearTimers();
    };
  }, [startNavigation, clearTimers]);

  // Do not render anything if spinner is not active
  if (!showSpinner) return null;

  return <LoadingSpinner exiting={isExiting} />;
}