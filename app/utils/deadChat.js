import { db } from "../firebaseConfig";
import { collection, getDocs, query, orderBy, limit} from "firebase/firestore";
import * as Sentry from "@sentry/nextjs";
import { getDateFromTimestamp, timestampToDate } from "./timestampToDate";


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
    try {
      const chatData = chat.data()
      const lettersRef = collection(db, "letterbox", chat.id, "letters");
  
      const q = query(lettersRef, orderBy("created_at", "desc"), limit(1));
  
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        Sentry.captureException("Letters documents do not exist");
        return;
      }
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
      const boxRef = collection(db, "letterbox");
      const q = query(boxRef);
      const querySnapshot = await getDocs(q, limit(5))
  
      querySnapshot.forEach(doc => {
          // console.log("this is the chatId", doc.id);
          deadChat(doc);
        }
      )
  }
  
 




