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

  