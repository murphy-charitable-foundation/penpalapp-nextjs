// components/NavigationStateManager.jsx
"use client";

import { useState, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import LoadingSkeleton from '../loading/LoadingSkeleton';
import LoadingSpinner from '../loading/LoadingSpinner';

export default function NavigationStateManager() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isExiting, setIsExiting] = useState(false);
  const [isEntering, setIsEntering] = useState(false);
  // const [sourceRoute, setSourceRoute] = useState('');
  const [targetUrl, setTargetUrl] = useState(null);

  useEffect(() => {
    // Track the current page for comparison
    let currentUrl = window.location.pathname + window.location.search;

    // Handler for navigation start - when leaving current page
    const handleNavigationStart = (url) => {
      setIsExiting(true);
      if (url) setTargetUrl(url);
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
        const url = new URL(target.href);
        const targetPath = url.pathname + url.search;
        if (targetPath !== currentUrl) {
          handleNavigationStart(targetPath);
        }
      }
    };

    // Intercept programmatic navigation
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function(state, unused, url) {
      if (url && url !== currentUrl) {
        handleNavigationStart(url);
      }
      return originalPushState.apply(this, arguments);
    };

    window.history.replaceState = function(state, unused, url) {
      if (url && url !== currentUrl) {
        handleNavigationStart(url);
      }
      return originalReplaceState.apply(this, arguments);
    };

    // Handle browser back/forward
    window.addEventListener('popstate', () => handleNavigationStart());
    
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

  // Handle the transition between exit and enter states
  useEffect(() => {
    if (isExiting) {
      // Short delay to show exit animation
      const exitTimer = setTimeout(() => {
        setIsExiting(false);
        setIsEntering(true);
      }, 100);
      
      return () => clearTimeout(exitTimer);
    }
  }, [isExiting]);

  // When pathname or searchParams change, navigation is complete
  useEffect(() => {
    // Small delay to prevent flickering for fast navigations
    const timer = setTimeout(() => {
      setIsExiting(false);
      setIsEntering(false);
      setTargetUrl(null);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  return (
    <>
      {isExiting && <LoadingSpinner />}
      {isEntering && <LoadingSkeleton />}
    </>
  );

}