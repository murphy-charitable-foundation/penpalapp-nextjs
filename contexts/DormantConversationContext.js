"use client";

import { createContext, useState, useContext, useEffect, useCallback } from "react";
import { logError } from "../app/utils/analytics";
import { auth } from "../app/firebaseConfig";

const DormantConversationContext = createContext(undefined);

/** Returns a Date for valid ISO strings, or null if missing/invalid (avoids NaN in diffs). */
function parseStoredISODate(value) {
  if (value == null || value === "") return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export const DormantConversationProvider = ({ children }) => {
  const [isDormantConversationLoading, setIsDormantConversationLoading] = useState(false);
  const [worker, setWorker] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const newWorker = new Worker(
        
        new URL("/workers/dormantConversationWorker.js", window.location.href)
      );
      setWorker(newWorker);
      newWorker.onmessage = (e) => {
        if (e.data.success) {
          localStorage.setItem("dormantConversationTimestamp", new Date().toISOString());
          console.log("OnMessage Email Request Success: ", e.data.data);
        } else {
          logError(`${e.data.error}`, {
            description: "Web Worker OnMessage Email Request Error",
          });
        }
        setIsDormantConversationLoading(false);
      };
      newWorker.onerror = (error) => {
        logError(error, {
          description: "Web Worker OnError",
        });
        setIsDormantConversationLoading(false);
      };
      return () => {
        console.log("Terminating worker");
        newWorker.terminate();
      };
    }
  }, []);

  const handleDormantConversationWorker = useCallback(async () => {
    if (isDormantConversationLoading) return;

    const lastAttemptRaw = localStorage.getItem("dormantConversationAttemptTimestamp");
    const lastAttemptDate = parseStoredISODate(lastAttemptRaw);
    if (lastAttemptRaw && !lastAttemptDate) {
      localStorage.removeItem("dormantConversationAttemptTimestamp");
    }
    if (lastAttemptDate) {
      const diffInMinutes = Math.floor(
        (Date.now() - lastAttemptDate.getTime()) / (1000 * 60)
      );
      // Cooldown to avoid repeated retries when API/worker fails.
      if (diffInMinutes < 60) return;
    }

    const dormantRaw = localStorage.getItem("dormantConversationTimestamp");
    const timestampDate = parseStoredISODate(dormantRaw);
    if (dormantRaw && !timestampDate) {
      localStorage.removeItem("dormantConversationTimestamp");
    }
    if (timestampDate) {
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
      logError(new Error("Dormant conversation: not signed in"), { description: "No auth user" });
      return;
    }
    let idToken;
    try {
      idToken = await user.getIdToken();
    } catch (err) {
      logError(err, { description: "Dormant conversation: failed to get token" });
      return;
    }
    localStorage.setItem("dormantConversationAttemptTimestamp", new Date().toISOString());
    setIsDormantConversationLoading(true);
    worker.postMessage({ idToken });
  }, [isDormantConversationLoading, worker]);

  return (
    <DormantConversationContext.Provider
      value={{
        isDormantConversationLoading,
        setIsDormantConversationLoading,
        handleDormantConversationWorker,
      }}
    >
      {children}
    </DormantConversationContext.Provider>
  );
};

export const useDormantConversation = () => {
  const context = useContext(DormantConversationContext);
  if (context === undefined) {
    throw new Error("useDormantConversation must be used within a DormantConversationProvider");
  }
  return context;
};
