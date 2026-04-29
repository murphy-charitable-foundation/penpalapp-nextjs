"use client";

import { createContext, useContext, useEffect, useState } from "react";

const CachedUserLoginsContext = createContext(null);
const STORAGE_KEY = "cached_users";

export function CachedUserLoginsProvider({ children }) {
  const [cachedUserLogins, setCachedUserLogins] = useState([]);
  const [hydrated, setHydrated] = useState(false);

  // Load from localStorage after mount
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setCachedUserLogins(Array.isArray(parsed) ? parsed : []);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
        setCachedUserLogins([]);
      }
    }
    setHydrated(true);
  }, []);

  // Persist on change
  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedUserLogins));
    }
  }, [cachedUserLogins, hydrated]);

  const addCachedUserLogin = (user) => {
    setCachedUserLogins((prev) => {
      const filtered = prev.filter((u) => u.id !== user.id);
      return [{ ...user, lastUsedAt: Date.now() }, ...filtered];
    });
  };

  const removeCachedUserLogin = (id) => {
    setCachedUserLogins((prev) => prev.filter((u) => u.id !== id));
  };

  const clearCachedUserLogins = () => {
    setCachedUserLogins([]);
  };

  const getCachedUserLogin = (id) => {
    return cachedUserLogins.find((u) => u.id === id);
  };

  return (
    <CachedUserLoginsContext.Provider
      value={{
        cachedUserLogins,
        addCachedUserLogin,
        removeCachedUserLogin,
        clearCachedUserLogins,
        getCachedUserLogin,
        hydrated,
      }}
    >
      {children}
    </CachedUserLoginsContext.Provider>
  );
}

export function useCachedUserLogins() {
  const ctx = useContext(CachedUserLoginsContext);
  if (!ctx) {
    throw new Error("useCachedUserLogins must be used inside CachedUserLoginsProvider");
  }
  return ctx;
}
