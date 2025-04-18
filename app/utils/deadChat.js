import { db } from "../firebaseConfig";
import { collection, collectionGroup, getDocs, getDoc, doc, query, orderBy, limit, where} from "firebase/firestore";
import * as Sentry from "@sentry/nextjs";
import { dateToTimestamp, timestampToDate } from "./timestampToDate";


const apiRequest = async (letterbox, emailId) => {
  try {
      const ids = letterbox.members.map((member) => {
        const segments = member._key?.path?.segments;
        if (segments?.[segments.length - 1] != emailId) {
          return segments?.[segments.length - 1];
        }
      });
      const sender = await getDoc(doc(db, "users", ids[0]));
      
      const response = await fetch('/api/deadchat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sender: sender, id: letterbox.id, emailId}), // Send data as JSON
      });
        
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
       
  } catch (error) {
      Sentry.captureException("Could not send request to SendGrid" + error);
  }
}


  export const iterateLetterBoxes = async () => {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    // Convert oneMonthAgo to Firestore Timestamp using dateToTimestamp
    const oneMonthAgoTimestamp = dateToTimestamp(oneMonthAgo);

    //Two indexes needed for this query but keeps read calls down.
    const allLettersQuery = query(
        collectionGroup(db, "letters"), 
        where("status", "==", "sent"),
        where("created_at", ">=", oneMonthAgoTimestamp),
        limit(5) // Use Firestore Timestamp here
    );

    const querySnapshot = await getDocs(allLettersQuery);
    const letterboxes = {}; 

    const documents = querySnapshot.docs.map(doc => ({
        id: doc.id,
        refPath: doc.ref.path, // Store path explicitly
        ...doc.data()
    }));

    documents.forEach((doc) => {
      const pathSegments = doc.refPath.split("/");
      const letterboxId = pathSegments[1];
  
      if (!letterboxes[letterboxId]) {
        letterboxes[letterboxId] = {};
      }
  
      if (!letterboxes[letterboxId][doc.sent_by]) {
        letterboxes[letterboxId][doc.sent_by] = [];
      }
  
      letterboxes[letterboxId][doc.sent_by].push(doc);
    });
  
    const letterboxSnapshot = await getDocs(collection(db, "letterbox"));
    const letterboxDocuments = letterboxSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const now = new Date();
    const twoWeeksAgo = new Date(now);
    twoWeeksAgo.setDate(now.getDate() - 14);
  
    for (const letterbox of letterboxDocuments) {
      const id = letterbox.id;
      const members = letterbox.members || [];
  
      const activityMap = letterboxes[id] || {};
  
      for (const member of members) {
        const lettersByMember = activityMap[member] || [];
  
        const lastSentDate = lettersByMember
          .map((letter) => letter.created_at?.toDate?.())
          .filter((d) => !!d)
          .sort((a, b) => b - a)[0]; // Most recent
  
        if (!lastSentDate || lastSentDate < twoWeeksAgo) {
          // Member has not sent a letter in the last 2 weeks
          await apiRequest(letterbox, member); // Pass letterbox and inactive member
        }
      }
    }
}; 