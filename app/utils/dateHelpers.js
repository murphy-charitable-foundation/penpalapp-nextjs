/**
 * Date helper utilities for messaging application
 */

import { Timestamp } from "firebase/firestore";

/**
 * Check if two dates are on different days
 * @param {Date|string|number|Object} date1
 * @param {Date|string|number|Object} date2
 * @returns {boolean}
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
 * Format timestamp for message display (WhatsApp-style)
 * @param {Date|string|number|{seconds:number,toDate?:Function}} timestamp
 * @returns {string}
 */
export const formatTimestamp = (timestamp) => {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  if (!timestamp) return "";

  // Normalize timestamp → Date
  let date;
  if (timestamp?.toDate && typeof timestamp.toDate === "function") {
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else if (typeof timestamp === "number" || typeof timestamp === "string") {
    date = new Date(timestamp);
  } else if (timestamp?.seconds) {
    date = new Date(timestamp.seconds * 1000);
  } else {
    return "";
  }

  const today = new Date();
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(todayStart.getDate() - 1);

  const messageDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  // Start of week (Monday)
  const weekStart = new Date(todayStart);
  const day = weekStart.getDay();
  const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
  weekStart.setDate(diff);

  // Today → time
  if (messageDay.getTime() === todayStart.getTime()) {
    return date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  // Yesterday
  if (messageDay.getTime() === yesterdayStart.getTime()) {
    return "Yesterday";
  }

  // This week
  if (date.getTime() >= weekStart.getTime()) {
    return days[date.getDay()];
  }

  // Older
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

/**
 * 🔹 BACKWARD-COMPAT ALIAS
 * Some pages still import `formatTime`
 * This prevents build failures without refactoring everything
 */
export const formatTime = formatTimestamp;

/**
 * Convert JS Date → Firestore Timestamp
 */
export const dateToTimestamp = (date) => {
  if (!date) return null;
  return Timestamp.fromDate(date);
};
