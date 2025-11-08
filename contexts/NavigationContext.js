"use client";
import { createContext, useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import LoadingSpinner from '../components/loading/LoadingSpinner';

const NavigationContext = createContext(null);

export function NavigationProvider({ children }) {
  const [isNavigating, setIsNavigating] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);
  const pathname = usePathname();

  // Reset navigation state when pathname changes (navigation complete)
  useEffect(() => {
    setIsNavigating(false);
    setShowSpinner(false);
  }, [pathname]);

  // Show spinner only if navigation takes longer than 200ms
  useEffect(() => {
    if (isNavigating) {
      const timer = setTimeout(() => {
        setShowSpinner(true);
      }, 200);
      return () => clearTimeout(timer);
    } else {
      setShowSpinner(false);
    }
  }, [isNavigating]);

  return (
    <NavigationContext.Provider value={{ isNavigating, setIsNavigating }}>
      {showSpinner && <LoadingSpinner />}
      {children}
    </NavigationContext.Provider>
  );
}

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};