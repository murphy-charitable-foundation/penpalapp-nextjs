
/**
 * Date helper utilities for messaging application
 */

import { Timestamp } from "firebase/firestore";

/**
 * Check if two dates are on different days
 * @param {Date|string|number|Object} date1 - First date to compare
 * @param {Date|string|number|Object} date2 - Second date to compare
 * @returns {boolean} - True if dates are on different days
 */
export const isDifferentDay = (date1, date2) => {
  if (!date1 || !date2) return false;

  const d1 = date1 instanceof Date ? date1 : new Date(date1);
  const d2 = date2 instanceof Date ? date2 : new Date(date2);

  return (
    d1.getFullYear() !== d2.getFullYear() ||
    d1.getMonth() !== d2.getMonth() ||
    d1.getDate() !== d2.getDate()
  );
};

/**
 * Format time for message display
 * @param {Date|string|number|{seconds: number, toDate?: function}} timestamp - Timestamp to format
 * @returns {string} - Formatted time string
 * Function to convert a timestamp into a readable message time
 * If the timestamp is from today, it displays the time in 12-hour format (e.g., 3:45 PM).
 * If the timestamp is from yesterday, it displays “Yesterday”.
 * If the timestamp is within the current week (from last Monday to today), it displays the day name (e.g., Monday).
 * For all other cases, it displays the date in the format “Mon DD, YYYY” (e.g., Jan 03, 2024).
 */
export const formatTimestamp = (timestamp) => {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  if (!timestamp) return "";

  // ---- Normalize timestamp into a JS Date ----
  let date;
  if (timestamp.toDate && typeof timestamp.toDate === "function") {
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else if (typeof timestamp === "number" || typeof timestamp === "string") {
    date = new Date(timestamp);
  } else if (timestamp.seconds) {
    date = new Date(timestamp.seconds * 1000);
  } else {
    return "";
  }

  // ---- Define comparison dates ----
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(todayStart.getDate() - 1);

  // Day before yesterday (used to detect older messages)
  const dayBeforeYesterdayStart = new Date(todayStart);
  dayBeforeYesterdayStart.setDate(todayStart.getDate() - 2);

  // Message day (midnight)
  const messageDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  // ---- Compute current week's Monday ----
  let weekStart = new Date(todayStart);
  const currentDayOfWeek = weekStart.getDay();
  const diff = weekStart.getDate() - currentDayOfWeek + (currentDayOfWeek === 0 ? -6 : 1);
  weekStart.setDate(diff);
  const messageTime = date.getTime();
  const weekStartTime = weekStart.getTime();

  // ---- Return values based on WhatsApp-like rules ----

  // Today → show time
  if (messageDay.getTime() === todayStart.getTime()) {
    return date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  // Yesterday → show "Yesterday"
  if (messageDay.getTime() === yesterdayStart.getTime()) {
    return "Yesterday";
  }

  // Within this week → show Day name (Mon, Tue, etc.)
  if (messageTime >= weekStartTime) {
    return days[date.getDay()];
  }

  // Older → show date (e.g., Jan 03, 2024)
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};


export const dateToTimestamp = (date) => {
  return Timestamp.fromDate(date); // Convert back to Firestore Timestamp
};

// Backward compatibility for older imports
export const formatTime = formatTimestamp;
