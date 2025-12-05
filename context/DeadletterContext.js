"use client";

import { createContext, useState, useContext, useEffect } from "react";

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
          console.log("OnMessage Email Request Success: ", e.data.data);
        } else {
          console.error("OnMessage Email Request Error: ", e.data.error);
        }
        setIsDeadletterLoading(false);
      };
      newWorker.onerror = (error) => {
        console.error("Worker error:", error);
        setIsDeadletterLoading(false);
      };
      return () => {
        console.log("Terminating worker");
        newWorker.terminate();
      };
    }
  }, []);

  const handleDeadletterWorker = () => {
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
