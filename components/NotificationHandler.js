"use client";

import { useEffect, useRef } from "react";
import { useUser } from "../contexts/UserContext";
import { initializeNotifications } from "../app/utils/notification";

export function NotificationHandler({ children }) {
  const { user } = useUser();
  const initializedUserIdRef = useRef(null);

  useEffect(() => {
    if (!user?.uid || initializedUserIdRef.current === user.uid) return;

    initializedUserIdRef.current = user.uid;
    initializeNotifications().catch((error) => {
      initializedUserIdRef.current = null;
      console.error("Notification setup failed:", error);
    });
  }, [user?.uid]);

  return children;
}
