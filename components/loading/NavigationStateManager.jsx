// components/NavigationStateManager.jsx
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import LoadingSpinner from '../loading/LoadingSpinner';

export default function NavigationStateManager() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);

  // Use refs to avoid stale closures in event handlers
  const currentUrlRef = useRef();
  const navigationStartTimeRef = useRef(null);

  // Update current URL ref when pathname/searchParams change
  useEffect(() => {
    currentUrlRef.current = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
  }, [pathname, searchParams]);

  // Memoized navigation handler to prevent recreating on every render
  const handleNavigationStart = useCallback((url) => {
    // Prevent multiple simultaneous navigations
    if (isNavigating) return;
    
    // Record navigation start time
    navigationStartTimeRef.current = Date.now();
    
    // Use setTimeout to defer state update to next tick
    setTimeout(() => {
      setIsNavigating(true);
    }, 0);
  }, [isNavigating]);

    
  useEffect(() => {
    // Add event listeners for link clicks
    const handleLinkClick = (e) => {
      const target = e.target.closest('a');
      if (
        target && 
        target.href && 
        target.href.startsWith(window.location.origin) && 
        !target.target && 
        !e.ctrlKey && 
        !e.metaKey && 
        !e.shiftKey
      ) {
        const url = new URL(target.href);
        const targetPath = url.pathname + url.search;

        if (targetPath !== currentUrlRef.current) {
          handleNavigationStart();
        }
      }
    };

    // Intercept programmatic navigation
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function(state, unused, url) {
      if (url && url !== currentUrlRef.current) {
        handleNavigationStart(url);
      }
      return originalPushState.apply(this, arguments);
    };

    window.history.replaceState = function(state, unused, url) {
      if (url && url !== currentUrlRef.current) {
        handleNavigationStart(url);
      }
      return originalReplaceState.apply(this, arguments);
    };

    // Handle browser back/forward
    const handlePopState = () => handleNavigationStart();

    // Handle browser back/forward
    window.addEventListener('popstate', () => handlePopState);
    // Add click listener for all links
    document.addEventListener('click', handleLinkClick);

    // Clean up function
    return () => {
      document.removeEventListener('click', handleLinkClick);
      window.removeEventListener('popstate', handleNavigationStart);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, [handleNavigationStart]);

  // When pathname or searchParams change, navigation is complete
  useEffect(() => {
    if (isNavigating && navigationStartTimeRef.current) {
      const elapsedTime = Date.now() - navigationStartTimeRef.current;
      const minDisplayTime = 1000; // 1 second minimum
      const remainingTime = Math.max(0, minDisplayTime - elapsedTime);
      
      const timer = setTimeout(() => {
        setIsNavigating(false);
        navigationStartTimeRef.current = null;
      }, remainingTime);
      
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams, isNavigating]);
   
  return (
    <>
      {isNavigating && <LoadingSpinner />}
    </>
  );

}