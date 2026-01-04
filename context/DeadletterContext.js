"use client";

import { createContext, useState, useContext, useEffect } from "react";
import { logError } from "../app/utils/analytics";

const DeadletterContext = createContext(undefined);

export const DeadletterProvider = ({ children }) => {
  const [isDeadletterLoading, setIsDeadletterLoading] = useState(false);
  const [worker, setWorker] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const newWorker = new Worker("/workers/deadletterWorker.js");
      setWorker(newWorker);
      newWorker.onmessage = (e) => {
        if (e.data.success) {
          localStorage.setItem("deadletterTimestamp", new Date().toISOString());
          console.log("OnMessage Email Request Success: ", e.data.data);
        } else {
          logError(`${e.data.error}`, {
            description: "Web Worker OnMessage Email Request Error",
          });
        }
        setIsDeadletterLoading(false);
      };
      newWorker.onerror = (error) => {
        logError(error, {
          description: "Web Worker OnError",
        });
        setIsDeadletterLoading(false);
      };
      return () => {
        console.log("Terminating worker");
        newWorker.terminate();
      };
    }
  }, []);

  const handleDeadletterWorker = () => {
    const deadletterTimestamp = localStorage.getItem("deadletterTimestamp");
    if (deadletterTimestamp) {
      const timestampDate = new Date(deadletterTimestamp);
      const now = new Date();
      const diffInDays = Math.floor(
        (now - timestampDate) / (1000 * 60 * 60 * 24)
      );

      if (diffInDays < 28) {
        return;
      }
    }

    if (worker) {
      setIsDeadletterLoading(true);
      worker.postMessage({});
    }
  };

  return (
    <DeadletterContext.Provider
      value={{
        isDeadletterLoading,
        setIsDeadletterLoading,
        handleDeadletterWorker,
      }}
    >
      {children}
    </DeadletterContext.Provider>
  );
};

export const useDeadletter = () => {
  const context = useContext(DeadletterContext);
  if (context === undefined) {
    throw new Error("useDeadletter must be used within a DeadletterProvider");
  }
  return context;
};
