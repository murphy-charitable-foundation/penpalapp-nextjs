"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

const InactivityContext = createContext();

export function InactivityProvider({ children }) {
  const [inactivityWarning, setInactivityWarning] = useState(false);
  const [inactivitySecondsLeft, setInactivitySecondsLeft] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const INACTIVITY_LIMIT = 20 * 60 * 1000;
    const WARNING_SECONDS = 30;

    let timer;
    let countdownInterval;
    let isInWarning = false;

    const activityEvents = [
      "mousemove",
      "keydown",
      "click",
      "scroll",
      "touchstart",
    ];

    function cleanupTimers() {
      if (timer) clearTimeout(timer);
      if (countdownInterval) clearInterval(countdownInterval);
    }

    function proceedLogout() {
      cleanupTimers();

      setInactivityWarning(false);
      setInactivitySecondsLeft(0);

      localStorage.removeItem("child");

      window.location.href = "/choose-profile";
    }

    function resetTimer() {
      if (isInWarning) {
        isInWarning = false;

        setInactivityWarning(false);
        setInactivitySecondsLeft(0);

        if (countdownInterval) {
          clearInterval(countdownInterval);
        }
      }

      if (timer) clearTimeout(timer);

      timer = setTimeout(() => {
        isInWarning = true;

        setInactivityWarning(true);

        let remaining = WARNING_SECONDS;

        setInactivitySecondsLeft(remaining);

        countdownInterval = setInterval(() => {
          remaining -= 1;

          setInactivitySecondsLeft(remaining);

          if (remaining <= 0) {
            proceedLogout();
          }
        }, 1000);
      }, INACTIVITY_LIMIT);
    }

    activityEvents.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    resetTimer();

    return () => {
      cleanupTimers();

      activityEvents.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, []);

  return (
    <InactivityContext.Provider
      value={{
        inactivityWarning,
        inactivitySecondsLeft,
      }}
    >
      {children}
      {inactivityWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg p-5 w-[90%] max-w-sm text-center space-y-3">
            <p className="font-semibold text-gray-900">Are you still there?</p>
            <p className="text-sm text-gray-600">
              Logging out in{" "}
              <span className="font-semibold text-gray-900">
                {inactivitySecondsLeft}s
              </span>
              .
            </p>
            <button
              type="button"
              onClick={() => {
                // Confirm response: trigger activity so the watcher resets the timer.
                window.dispatchEvent(new Event("mousemove"));
              }}
              className="w-full rounded-full bg-primary hover:bg-primary-light text-white py-3 font-bold"
            >
              I&apos;m still here
            </button>
          </div>
        </div>
      )}
    </InactivityContext.Provider>
  );
}

export function useInactivity() {
  const ctx = useContext(InactivityContext);

  if (!ctx) {
    throw new Error(
      "useInactivity must be used within an InactivityProvider"
    );
  }

  return ctx;
}