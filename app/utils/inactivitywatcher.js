"use client";
// inactivityWatcher.js


export function startInactivityWatcher(timeoutMinutes = 30, router) {
    var INACTIVITY_LIMIT = timeoutMinutes * 60 * 1000; // convert minutes to ms
    var timer;
  
    function clearStoredData() {
      localStorage.removeItem("child");
      router.push("/children-gallery")
      console.log("Removed " + "child" + " from localStorage due to inactivity");
    }
  
    function resetTimer() {
      if (timer) clearTimeout(timer);
      timer = setTimeout(clearStoredData, INACTIVITY_LIMIT);
    }
  
    // Attach activity listeners
    var activityEvents = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    activityEvents.forEach(function(event) {
      window.addEventListener(event, resetTimer);
    });
  
    // Start timer immediately
    resetTimer();
  
    // Return a cleanup function if you want to stop it later
    return function stopWatcher() {
      clearTimeout(timer);
      activityEvents.forEach(function(event) {
        window.removeEventListener(event, resetTimer);
      });
    };
  }
  