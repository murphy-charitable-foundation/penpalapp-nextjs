"use client";

import { createContext, useState, useContext, useEffect } from "react";
import { logError } from "../app/utils/analytics";

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

  const handleDormantLetterboxWorker = () => {
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

    if (worker) {
      setIsDormantLetterboxLoading(true);
      worker.postMessage({});
    }
  };

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
