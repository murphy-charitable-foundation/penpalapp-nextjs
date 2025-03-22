import { Timestamp } from "firebase/firestore";


export const dateToTimestamp = (date) => {
    const adjustedDate = new Date(date); // Create a new Date instance
    adjustedDate.setMonth(adjustedDate.getMonth() - 1); // Subtract one month
    return Timestamp.fromDate(adjustedDate); // Convert back to Firestore Timestamp
};



export const timestampToDate = (timestamp) => {
    // Check if the timestamp is a Firestore Timestamp object
    if (timestamp && timestamp.toDate) {
        return timestamp.toDate();
    }
    // If not, return an invalid date
    return new Date(NaN);
}

  
