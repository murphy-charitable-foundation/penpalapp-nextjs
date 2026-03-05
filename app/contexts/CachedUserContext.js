"use client";

import { createContext, useContext, useEffect, useState } from "react";

const CachedUsersContext = createContext(null);
const STORAGE_KEY = "cached_users";

export function CachedUsersProvider({ children }) {
  const [cachedUsers, setCachedUsers] = useState([]);
  const [hydrated, setHydrated] = useState(false);

  // Load from localStorage after mount
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      setCachedUsers(JSON.parse(raw));
    }
    setHydrated(true);
  }, []);

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

  const getCachedUser = (id) => {
    return cachedUsers.find((u) => u.id === id);
  };

  return (
    <CachedUsersContext.Provider
      value={{
        cachedUsers,
        addCachedUser,
        removeCachedUser,
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
