// components/NavigationStateManager.jsx
"use client";

import { useState, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import LoadingSpinner from './LoadingSpinner';


export default function NavigationStateManager() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    // Handler for navigation start
    const handleNavigationStart = () => {
      setIsNavigating(true);
    };

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
        handleNavigationStart();
      }
    };

    // Intercept programmatic navigation
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function() {
      handleNavigationStart();
      return originalPushState.apply(this, arguments);
    };

    window.history.replaceState = function() {
      handleNavigationStart();
      return originalReplaceState.apply(this, arguments);
    };

    // Handle browser back/forward
    window.addEventListener('popstate', handleNavigationStart);
    
    // Add click listener for all links
    document.addEventListener('click', handleLinkClick);

    // Clean up function
    return () => {
      document.removeEventListener('click', handleLinkClick);
      window.removeEventListener('popstate', handleNavigationStart);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, []);

  // When pathname or searchParams change, navigation is complete
  useEffect(() => {
    // Small delay to prevent flickering for fast navigations
    const timer = setTimeout(() => {
      setIsNavigating(false);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  // Only render the spinner when navigating
  return isNavigating ? <LoadingSpinner /> : null;
}