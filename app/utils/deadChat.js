import { db } from "../firebaseConfig";
import { collection, collectionGroup, getDocs, query, orderBy, limit, where} from "firebase/firestore";
import * as Sentry from "@sentry/nextjs";
import { dateToTimestamp, timestampToDate } from "./timestampToDate";


const apiRequest = async (sender, users, id) => {
  try {     
      const response = await fetch('/api/deadchat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sender, users, id  }), // Send data as JSON
      });
        
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
       
  } catch (error) {
      Sentry.captureException("Could not send request to SendGrid" + error);
  }
}




  
const deadChat = async (chat) => {
    //If letterbox ID not a key in letterboxes object call apiRequest to send out an email.
    try {
    
      const requests = letterboxDocuments
         .filter(document => !letterboxes.hasOwnProperty(document.id))
         .map(document => apiRequest(document.members, chat.id));

      await Promise.all(requests);
    } catch (error) {
      Sentry.captureException(error);
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
        where("created_at", ">=", oneMonthAgoTimestamp) // Use Firestore Timestamp here
    );

    const querySnapshot = await getDocs(allLettersQuery);
    const letterboxes = {}; 

    const documents = querySnapshot.docs.map(doc => ({
        id: doc.id,
        refPath: doc.ref.path, // Store path explicitly
        ...doc.data()
    }));

    documents.forEach(doc => {
        const pathSegments = doc.refPath.split("/"); 
        const letterboxId = pathSegments[1]; 
        
        if (!letterboxes[letterboxId]) {
            letterboxes[letterboxId] = [];
        }
        letterboxes[letterboxId].push(doc);
    });
    //Grab letterboxes to compare if they had letters more recent than a month.
    const allLetterboxes = query(
      collection("db", "letterbox"),
    )
    const letterboxSnapshot = await getDocs(allLetterboxes);
    const letterboxDocuments = letterboxSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
    for (const [letterboxId, letters] of Object.entries(letterboxes)) {
        console.log(`Letterbox ${letterboxId}:`, letters);
        // deadchat(letterboxes, letterboxDocuments);
    }
};