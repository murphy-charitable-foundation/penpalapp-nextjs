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

export const formatDisplayDate = (date) => {
    const now = new Date();

    if (!(date instanceof Date)) {
        date = timestampToDate(date);
    }
    if (isNaN(date.getTime())) {
        return "Invalid date";
    }
    const inputDate = date;
    const isToday = inputDate.toDateString() === now.toDateString();

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = inputDate.toDateString() === yesterday.toDateString();

    const sameYear = inputDate.getFullYear() === now.getFullYear();

    const optionsDateOnly = { month: 'long', day: 'numeric' };
    const optionsDateWithYear = { month: 'long', day: 'numeric', year: 'numeric' };
    const optionsTimeOnly = { hour: '2-digit', minute: '2-digit' };

    if (isToday) {
        return inputDate.toLocaleTimeString([], optionsTimeOnly);
    } else if (isYesterday) {
        return `Yesterday ${inputDate.toLocaleTimeString([], optionsTimeOnly)}`;
    } else if (sameYear) {
        return inputDate.toLocaleDateString([], optionsDateOnly);
    } else {
        return inputDate.toLocaleDateString([], optionsDateWithYear);
    }
}