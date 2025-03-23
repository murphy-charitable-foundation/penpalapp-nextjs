import { db } from "../firebaseConfig";
import { collection, collectionGroup, getDocs, query, orderBy, limit, where} from "firebase/firestore";
import * as Sentry from "@sentry/nextjs";
import { dateToTimestamp, timestampToDate } from "./timestampToDate";


const apiRequest = async (letterbox) => {
  try {     
      const response = await fetch('/api/deadchat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ members: letterbox.members, id: letterbox.id  }), // Send data as JSON
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
      collection(db, "letterbox"),
    )
    const letterboxSnapshot = await getDocs(allLetterboxes);
    const letterboxDocuments = letterboxSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));

    for (let key in letterboxDocuments) {    
      if (!letterboxes[letterboxDocuments[key].id]){
        console.log("No recent letters");
        await apiRequest(letterboxDocuments[key]);
      }
        
    }
}; 