"use client";

import { useEffect } from "react";

export default function useInactivityWatcher(router, timeoutMinutes = 30) {
  

  useEffect(() => {
    const INACTIVITY_LIMIT = timeoutMinutes * 60 * 1000; // convert minutes → ms
    let timer;

    const clearStoredData = () => {
      localStorage.removeItem("child");
      router.push("/children-gallery");
      console.log("Removed 'child' from localStorage due to inactivity");
    };

    const resetTimer = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(clearStoredData, INACTIVITY_LIMIT);
    };

    const activityEvents = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    activityEvents.forEach(event => window.addEventListener(event, resetTimer));

    resetTimer(); // start timer immediately

    return () => {
      clearTimeout(timer);
      activityEvents.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [router, timeoutMinutes]);
}
