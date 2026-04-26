"use client";

import { createContext, useContext, useEffect, useState } from "react";

const CachedUsersContext = createContext(null);
const STORAGE_KEY = "cachedUsers";

export function CachedUsersProvider({ children }) {
  const [cachedUsers, setCachedUsers] = useState(() => {
    if (typeof window === "undefined") return [];

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return [];
    }
  });
  const [hydrated, setHydrated] = useState(true);

  // Persist on change
  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedUsers));
    }
  }, [cachedUsers, hydrated]);

  const addCachedUser = (user) => {
    setCachedUsers((prev) => {
      const filtered = prev.filter((u) => u.id !== user.id);
      return [{ ...user, lastUsedAt: Date.now() }, ...filtered];
    });
  };

  const removeCachedUser = (id) => {
    setCachedUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const clearCachedUsers = () => {
    setCachedUsers([]);
  };

  const getCachedUser = (id) => {
    return cachedUsers.find((u) => u.id === id);
  };

  return (
    <CachedUsersContext.Provider
      value={{
        cachedUsers,
        setCachedUsers,
        addCachedUser,
        removeCachedUser,
        clearCachedUsers,
        getCachedUser,
        hydrated,
      }}
    >
      {children}
    </CachedUsersContext.Provider>
  );
}

export function useCachedUsers() {
  const ctx = useContext(CachedUsersContext);
  if (!ctx) {
    throw new Error("useCachedUsers must be used inside CachedUsersProvider");
  }
  return ctx;
}
