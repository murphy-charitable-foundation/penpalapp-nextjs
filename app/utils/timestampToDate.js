import { Timestamp } from "firebase/firestore";


export const dateToTimestamp = (date) => {
  return Timestamp.fromDate(date); // Convert back to Firestore Timestamp
};



export const timestampToDate = (timestamp) => {
  // Check if the timestamp is a Firestore Timestamp object
  if (timestamp && timestamp.toDate) {
    return timestamp.toDate();
  }
  // If not, return an invalid date
  return new Date(NaN);
}

//Function to convert timestamp based on this criteria
// If the timestamp is from today, it displays the time in 12-hour format (e.g., 3:45 PM).
// If the timestamp is from yesterday, it displays “Yesterday”.
// If the timestamp is within the current week (from last Monday to today), it displays the day name (e.g., Monday).
// For all other cases, it displays the date in MM-DD-YYYY format.
export const formatDate = (timestamp) => {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

  if (!timestamp) return "";
  const date =
    typeof timestamp.toDate === "function"
      ? timestamp.toDate()
      : new Date(timestamp.seconds * 1000);

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  let presentDate = new Date();
  presentDate.setHours(0, 0, 0, 0);
  let day = presentDate.getDay()
  let diff = presentDate.getDate() - day + (day == 0 ? -6 : 1); //Calculating last monday date
  let lastMonday = new Date(presentDate.setDate(diff));
  let currTime = new Date(date).getTime();
  let mondayTime = new Date(lastMonday).getTime();

  const timeString = date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  if (date.toDateString() === today.toDateString()) { //If current date show time 
    return `${timeString}`;
  } else if (date.toDateString() === yesterday.toDateString()) { //Show yesterday for previous day
    return `Yesterday`;
  } else if (currTime >= mondayTime) { //If a date in the previous week, display the day string
    return days[date.getDay()];
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
};