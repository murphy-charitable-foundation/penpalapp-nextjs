// components/NavigationStateManager.jsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import LoadingSpinner from "../loading/LoadingSpinner";

export default function NavigationStateManager() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // UI states
  const [showSpinner, setShowSpinner] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // Refs
  const currentUrlRef = useRef("");
  const navStartRef = useRef(null);
  const isNavigatingRef = useRef(false);

  const safetyTimerRef = useRef(null);
  const finishTimerRef = useRef(null);
  const exitTimerRef = useRef(null);

  // Prevent stale timers from older navigations
  const runIdRef = useRef(0);

  // Tunables
  const minDisplayTime = 400;     // ✅ X ms (300–500 feels good)
  const fadeOutDuration = 200;    // ✅ smooth hide duration
  const maxHangTime = 8000;       // safety

  // Keep current URL updated
  useEffect(() => {
    const qs = searchParams?.toString?.() || "";
    currentUrlRef.current = pathname + (qs ? `?${qs}` : "");
  }, [pathname, searchParams]);

  const clearAllTimers = () => {
    if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
    if (finishTimerRef.current) clearTimeout(finishTimerRef.current);
    if (exitTimerRef.current) clearTimeout(exitTimerRef.current);

    safetyTimerRef.current = null;
    finishTimerRef.current = null;
    exitTimerRef.current = null;
  };

  const hardStop = useCallback(() => {
    clearAllTimers();
    setIsExiting(false);
    setShowSpinner(false);
    isNavigatingRef.current = false;
    navStartRef.current = null;
  }, []);

  const startNavigation = useCallback(() => {
    // Prevent duplicate starts
    if (isNavigatingRef.current) return;

    isNavigatingRef.current = true;
    navStartRef.current = Date.now();
    const runId = ++runIdRef.current;

    clearAllTimers();

    // ✅ show immediately (same tick / next paint)
    setIsExiting(false);
    setShowSpinner(true);

    // Safety: never hang forever
    safetyTimerRef.current = setTimeout(() => {
      // only if still same run
      if (runIdRef.current === runId) hardStop();
    }, maxHangTime);
  }, [hardStop]);

  const finishNavigation = useCallback(() => {
    if (!isNavigatingRef.current || !navStartRef.current) return;

    const runId = runIdRef.current;
    const elapsed = Date.now() - navStartRef.current;
    const remaining = Math.max(0, minDisplayTime - elapsed);

    // Wait until minDisplayTime passes, then fade out, then unmount
    finishTimerRef.current = setTimeout(() => {
      if (runIdRef.current !== runId) return;

      setIsExiting(true);

      exitTimerRef.current = setTimeout(() => {
        if (runIdRef.current !== runId) return;
        hardStop();
      }, fadeOutDuration);
    }, remaining);
  }, [hardStop]);

  // Route change => navigation done
  useEffect(() => {
    finishNavigation();
  }, [pathname, searchParams, finishNavigation]);

  useEffect(() => {
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
      if (next !== currentUrlRef.current) startNavigation();
    };

    // Intercept programmatic navigation
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function (state, unused, url) {
      if (typeof url === "string") {
        const next = new URL(url, window.location.origin);
        const nextPath = next.pathname + next.search;
        if (nextPath !== currentUrlRef.current) startNavigation();
      }
      return originalPushState.apply(this, arguments);
    };

    window.history.replaceState = function (state, unused, url) {
      if (typeof url === "string") {
        const next = new URL(url, window.location.origin);
        const nextPath = next.pathname + next.search;
        if (nextPath !== currentUrlRef.current) startNavigation();
      }
      return originalReplaceState.apply(this, arguments);
    };

    const handlePopState = () => startNavigation();

    document.addEventListener("click", handleLinkClick);
    window.addEventListener("popstate", handlePopState);

    return () => {
      document.removeEventListener("click", handleLinkClick);
      window.removeEventListener("popstate", handlePopState);

      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;

      clearAllTimers();
    };
  }, [startNavigation]);

  return (
    <>
      {showSpinner && <LoadingSpinner exiting={isExiting} />}
    </>
  );
}