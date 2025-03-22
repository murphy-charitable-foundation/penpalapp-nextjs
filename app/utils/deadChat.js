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
    //Given the chat in this function store the letterbox and information of the document in an object. Access object later to sift through each letterbox and find most recent document.
    try {
      //const chatData = chat.data()
      //const lettersRef = collection(db, "letterbox", chat.id, "letters");
  
      //const q = query(lettersRef, orderBy("created_at", "desc"), limit(1));
  
      //const querySnapshot = await getDocs(q);
      /*if (querySnapshot.empty) {
        Sentry.captureException("Letters documents do not exist");
        return;
      }*/
      // Process the data
      const doc = querySnapshot.docs[0];
      const data = doc.data();
     
      const mostRecentDate = new Date(timestampToDate(data.created_at));
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  
      if (mostRecentDate < oneMonthAgo) {
        await apiRequest(data.sent_by, chatData.members, chat.id);
      } 
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