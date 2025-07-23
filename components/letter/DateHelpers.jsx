/**
 * Date helper utilities for messaging application
 */

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
 * Format date for separator display
 * @param {Date|string|number|Object} timestamp - Timestamp to format
 * @returns {string} - Formatted date string (Today, Yesterday, or full date)
 */
export const formatDateSeparator = (timestamp) => {
  if (!timestamp) return "";

  let date;
  if (timestamp.toDate && typeof timestamp.toDate === "function") {
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else if (typeof timestamp === "number" || typeof timestamp === "string") {
    date = new Date(timestamp);
  } else {
    return "";
  }

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Check if it's today
  if (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  ) {
    return "Today";
  }

  // Check if it's yesterday
  if (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  ) {
    return "Yesterday";
  }

  // Format as date
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

/**
 * Format time for message display
 * @param {Date|string|number|Object} timestamp - Timestamp to format
 * @returns {string} - Formatted time string
 */
export const formatTime = (timestamp) => {
  if (!timestamp) return "";

  let date;
  if (timestamp.toDate && typeof timestamp.toDate === "function") {
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else if (typeof timestamp === "number" || typeof timestamp === "string") {
    date = new Date(timestamp);
  } else {
    return "";
  }

  // Get today's date and day before yesterday
  const today = new Date();
  const dayBeforeYesterday = new Date(today);
  dayBeforeYesterday.setDate(today.getDate() - 2);

  // Reset time to start of day for accurate comparison
  const messageDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
  const dayBeforeYesterdayStart = new Date(
    dayBeforeYesterday.getFullYear(),
    dayBeforeYesterday.getMonth(),
    dayBeforeYesterday.getDate()
  );

  // If message is older than day before yesterday, show MM/DD/YYYY
  if (messageDate < dayBeforeYesterdayStart) {
    return date.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
  }

  // Otherwise show time as before
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};