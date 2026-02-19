// components/NavigationStateManager.jsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import LoadingSpinner from "../loading/LoadingSpinner";

export default function NavigationStateManager() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isNavigating, setIsNavigating] = useState(false);

  // Refs to avoid stale closures + prevent duplicate starts
  const currentUrlRef = useRef("");
  const navigationStartTimeRef = useRef(null);
  const isNavigatingRef = useRef(false);
  const safetyTimerRef = useRef(null);

  // Keep current URL updated
  useEffect(() => {
    const qs = searchParams?.toString?.() || "";
    currentUrlRef.current = pathname + (qs ? `?${qs}` : "");
  }, [pathname, searchParams]);

  const startNavigation = useCallback((nextUrl = "") => {
    // Prevent multiple simultaneous navigations
    if (isNavigatingRef.current) return;

    isNavigatingRef.current = true;
    navigationStartTimeRef.current = Date.now();

    // Show spinner next tick
    setTimeout(() => setIsNavigating(true), 0);

    // Safety: never let spinner hang forever
    if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
    safetyTimerRef.current = setTimeout(() => {
      setIsNavigating(false);
      isNavigatingRef.current = false;
      navigationStartTimeRef.current = null;
    }, 8000);
  }, []);

  // When route changes, navigation is complete (with min display time)
  useEffect(() => {
    if (!isNavigatingRef.current || !navigationStartTimeRef.current) return;

    const elapsed = Date.now() - navigationStartTimeRef.current;
    const minDisplayTime = 1000;
    const remaining = Math.max(0, minDisplayTime - elapsed);

    const timer = setTimeout(() => {
      setIsNavigating(false);
      isNavigatingRef.current = false;
      navigationStartTimeRef.current = null;

      if (safetyTimerRef.current) {
        clearTimeout(safetyTimerRef.current);
        safetyTimerRef.current = null;
      }
    }, remaining);

    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  useEffect(() => {
    // Capture link clicks (same-origin, normal left click)
    const handleLinkClick = (e) => {
      const a = e.target.closest?.("a");
      if (!a) return;

      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        a.target ||
        a.hasAttribute("download") ||
        e.ctrlKey ||
        e.metaKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }

      const href = a.getAttribute("href");
      if (!href) return;

      const url = new URL(a.href, window.location.origin);
      if (url.origin !== window.location.origin) return;

      const next = url.pathname + url.search;
      if (next !== currentUrlRef.current) startNavigation(next);
    };

    // Intercept programmatic navigation
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function (state, unused, url) {
      if (typeof url === "string" && url !== currentUrlRef.current) {
        startNavigation(url);
      }
      return originalPushState.apply(this, arguments);
    };

    window.history.replaceState = function (state, unused, url) {
      if (typeof url === "string" && url !== currentUrlRef.current) {
        startNavigation(url);
      }
      return originalReplaceState.apply(this, arguments);
    };

    // Back/forward handler (THIS is the important fix)
    const handlePopState = () => startNavigation("popstate");

    document.addEventListener("click", handleLinkClick);
    window.addEventListener("popstate", handlePopState);

    return () => {
      document.removeEventListener("click", handleLinkClick);
      window.removeEventListener("popstate", handlePopState);

      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;

      if (safetyTimerRef.current) {
        clearTimeout(safetyTimerRef.current);
        safetyTimerRef.current = null;
      }
    };
  }, [startNavigation]);

  return <>{isNavigating && <LoadingSpinner />}</>;
}
