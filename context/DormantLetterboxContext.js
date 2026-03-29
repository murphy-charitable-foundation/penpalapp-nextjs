"use client";

import { createContext, useState, useContext, useEffect, useCallback } from "react";
import { logError } from "../app/utils/analytics";
import { auth } from "../app/firebaseConfig";

const DormantLetterboxContext = createContext(undefined);

export const DormantLetterboxProvider = ({ children }) => {
  const [isDormantLetterboxLoading, setIsDormantLetterboxLoading] = useState(false);
  const [worker, setWorker] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const newWorker = new Worker("/workers/dormantLetterboxWorker.js");
      setWorker(newWorker);
      newWorker.onmessage = (e) => {
        if (e.data.success) {
          localStorage.setItem("dormantLetterboxTimestamp", new Date().toISOString());
          console.log("OnMessage Email Request Success: ", e.data.data);
        } else {
          logError(`${e.data.error}`, {
            description: "Web Worker OnMessage Email Request Error",
          });
        }
        setIsDormantLetterboxLoading(false);
      };
      newWorker.onerror = (error) => {
        logError(error, {
          description: "Web Worker OnError",
        });
        setIsDormantLetterboxLoading(false);
      };
      return () => {
        console.log("Terminating worker");
        newWorker.terminate();
      };
    }
  }, []);

  const handleDormantLetterboxWorker = useCallback(async () => {
    if (isDormantLetterboxLoading) return;

    const lastAttempt = localStorage.getItem("dormantLetterboxAttemptTimestamp");
    if (lastAttempt) {
      const diffInMinutes = Math.floor(
        (Date.now() - new Date(lastAttempt).getTime()) / (1000 * 60)
      );
      // Cooldown to avoid repeated retries when API/worker fails.
      if (diffInMinutes < 60) return;
    }

    const dormantLetterboxTimestamp = localStorage.getItem("dormantLetterboxTimestamp");
    if (dormantLetterboxTimestamp) {
      const timestampDate = new Date(dormantLetterboxTimestamp);
      const now = new Date();
      const diffInDays = Math.floor(
        (now - timestampDate) / (1000 * 60 * 60 * 24)
      );

      if (diffInDays < 28) {
        return;
      }
    }

    if (!worker) return;
    const user = auth?.currentUser;
    if (!user) {
      logError(new Error("Dormant letterbox: not signed in"), { description: "No auth user" });
      return;
    }
    let idToken;
    try {
      idToken = await user.getIdToken();
    } catch (err) {
      logError(err, { description: "Dormant letterbox: failed to get token" });
      return;
    }
    localStorage.setItem("dormantLetterboxAttemptTimestamp", new Date().toISOString());
    setIsDormantLetterboxLoading(true);
    worker.postMessage({ idToken });
  }, [isDormantLetterboxLoading, worker]);

  return (
    <DormantLetterboxContext.Provider
      value={{
        isDormantLetterboxLoading,
        setIsDormantLetterboxLoading,
        handleDormantLetterboxWorker,
      }}
    >
      {children}
    </DormantLetterboxContext.Provider>
  );
};

export const useDormantLetterbox = () => {
  const context = useContext(DormantLetterboxContext);
  if (context === undefined) {
    throw new Error("useDormantLetterbox must be used within a DormantLetterboxProvider");
  }
  return context;
};
