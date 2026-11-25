"use client";

import { createContext, useState, useContext, useEffect, useCallback, useRef } from "react";
import { logDormantMessageSent, logError } from "../app/utils/analytics";
import { auth } from "../app/firebaseConfig";
import { SafeStorage } from "../app/utils/safeStorage";
import {
  ATTEMPT_TIMESTAMP_KEY,
  canStartDormantConversationCheck,
  handleDormantConversationResult,
} from "../app/utils/dormantConversationResult";

const DormantConversationContext = createContext(undefined);

export const DormantConversationProvider = ({ children }) => {
  const [isDormantConversationLoading, setIsDormantConversationLoading] = useState(false);
  const workerRef = useRef(null);
  const inFlightRef = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const newWorker = new Worker(
        new URL("/workers/dormantConversationWorker.js", window.location.href)
      );
      workerRef.current = newWorker;
      newWorker.onmessage = (e) => {
        try {
          handleDormantConversationResult(e.data, {
            storage: SafeStorage,
            logError,
            logDormantMessageSent,
          });
        } finally {
          inFlightRef.current = false;
          setIsDormantConversationLoading(false);
        }
      };
      newWorker.onerror = (error) => {
        logError(error, {
          description: "Web Worker OnError",
          source: "web_worker",
        });
        inFlightRef.current = false;
        setIsDormantConversationLoading(false);
      };
      return () => {
        workerRef.current = null;
        inFlightRef.current = false;
        newWorker.terminate();
      };
    }
  }, []);

  const handleDormantConversationWorker = useCallback(async () => {
    if (inFlightRef.current || !canStartDormantConversationCheck(SafeStorage)) return;

    const worker = workerRef.current;
    if (!worker) return;
    const user = auth?.currentUser;
    if (!user) {
      logError(new Error("Dormant conversation: not signed in"), { description: "No auth user" });
      return;
    }
    // Lock before requesting the token so concurrent callers cannot queue a
    // second run while authentication is pending.
    inFlightRef.current = true;
    try {
      const idToken = await user.getIdToken();
      if (workerRef.current !== worker) return;
      SafeStorage.setItem(ATTEMPT_TIMESTAMP_KEY, new Date().toISOString());
      setIsDormantConversationLoading(true);
      worker.postMessage({ idToken });
    } catch (err) {
      inFlightRef.current = false;
      setIsDormantConversationLoading(false);
      logError(err, { description: "Dormant conversation: failed to start worker" });
    }
  }, []);

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
