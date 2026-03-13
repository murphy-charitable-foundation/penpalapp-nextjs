// components/NavigationStateManager.jsx
"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import LoadingSpinner from "../loading/LoadingSpinner";

export default function NavigationStateManager() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [showSpinner, setShowSpinner] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const currentUrlRef = useRef("");
  const navigationStartedRef = useRef(false);
  const startTimeRef = useRef(null);

  const safetyTimerRef = useRef(null);
  const hideTimerRef = useRef(null);
  const fadeTimerRef = useRef(null);

  const MIN_DISPLAY_TIME = 250;
  const FADE_OUT_TIME = 150;
  const MAX_WAIT_TIME = 5000;

  // Keep the current route so we can avoid showing the spinner for the same page
  useEffect(() => {
    const qs = searchParams?.toString?.() || "";
    currentUrlRef.current = pathname + (qs ? `?${qs}` : "");
  }, [pathname, searchParams]);

  const clearTimers = () => {
    if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);

    safetyTimerRef.current = null;
    hideTimerRef.current = null;
    fadeTimerRef.current = null;
  };

  const resetSpinner = () => {
    clearTimers();
    setShowSpinner(false);
    setIsExiting(false);
    navigationStartedRef.current = false;
    startTimeRef.current = null;
  };

  const startNavigation = () => {
    // Prevent duplicate starts while a navigation is already in progress
    if (navigationStartedRef.current) return;

    navigationStartedRef.current = true;
    startTimeRef.current = Date.now();
    setIsExiting(false);
    setShowSpinner(true);

    // Safety fallback in case navigation gets stuck
    safetyTimerRef.current = setTimeout(() => {
      resetSpinner();
    }, MAX_WAIT_TIME);
  };

  const finishNavigation = () => {
    if (!navigationStartedRef.current || !startTimeRef.current) return;

    const elapsed = Date.now() - startTimeRef.current;
    const remaining = Math.max(0, MIN_DISPLAY_TIME - elapsed);

    // Keep the spinner visible briefly, then fade it out
    hideTimerRef.current = setTimeout(() => {
      setIsExiting(true);

      fadeTimerRef.current = setTimeout(() => {
        resetSpinner();
      }, FADE_OUT_TIME);
    }, remaining);
  };

  // When the route changes, treat navigation as complete
  useEffect(() => {
    finishNavigation();
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleClick = (e) => {
      const link = e.target.closest?.("a");
      if (!link) return;

      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        link.target ||
        link.hasAttribute("download") ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }

      const href = link.getAttribute("href");
      if (!href) return;

      const nextUrl = new URL(link.href, window.location.origin);

      // Ignore external links
      if (nextUrl.origin !== window.location.origin) return;

      const nextPath = nextUrl.pathname + nextUrl.search;

      if (nextPath !== currentUrlRef.current) {
        startNavigation();
      }
    };

    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    // Handle programmatic navigation
    window.history.pushState = function (...args) {
      const url = args[2];

      if (typeof url === "string") {
        const nextUrl = new URL(url, window.location.origin);
        const nextPath = nextUrl.pathname + nextUrl.search;

        if (nextPath !== currentUrlRef.current) {
          startNavigation();
        }
      }

      return originalPushState.apply(this, args);
    };

    window.history.replaceState = function (...args) {
      const url = args[2];

      if (typeof url === "string") {
        const nextUrl = new URL(url, window.location.origin);
        const nextPath = nextUrl.pathname + nextUrl.search;

        if (nextPath !== currentUrlRef.current) {
          startNavigation();
        }
      }

      return originalReplaceState.apply(this, args);
    };

    const handlePopState = () => {
      startNavigation();
    };

    document.addEventListener("click", handleClick);
    window.addEventListener("popstate", handlePopState);

    return () => {
      document.removeEventListener("click", handleClick);
      window.removeEventListener("popstate", handlePopState);

      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;

      clearTimers();
    };
  }, []);

  if (!showSpinner) return null;

  return <LoadingSpinner exiting={isExiting} />;
}