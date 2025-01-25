import { db } from "../firebaseConfig";
import { collection, getDocs, getDoc, query, where, orderBy, Timestamp, limit} from "firebase/firestore";
import * as Sentry from "@sentry/nextjs";


const apiRequest = async (users, id) => {
  try {     
      const response = await fetch('/api/deadchat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ users, id  }), // Send data as JSON
      });
        
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
       
  } catch (error) {
      Sentry.captureException("Could not send request to SendGrid" + error);
  }
}

function getDateFromTimestamp(timestamp) {
  // Check if the timestamp is a Firestore Timestamp object
  if (timestamp && timestamp.toDate) {
      return timestamp.toDate();
  }
  // If not, return an invalid date
  return new Date(NaN);
}


  
const deadChat = async (chat) => {
    console.log("we have entered deadchat");
    try {
      const chatData = chat.data()
      const lettersRef = collection(db, "letterbox", chat.id, "letters");
  
      const q = query(lettersRef, orderBy("created_at", "desc"));
  
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        Sentry.captureException("Letters documents do not exist");
        return;
      }
      // Process the data
      
      const chats = [];
      querySnapshot.forEach(doc => {
        chats.push({ id: doc.id, ...doc.data() });
      });

     
      const mostRecentDate = new Date(getDateFromTimestamp(chats[0].created_at));
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  
      if (mostRecentDate < oneMonthAgo) {
        await apiRequest(chatData.members, chat.id);
      } 
    } catch (error) {
      Sentry.captureException(error);
    }
  
  }

export const iterateLetterBoxes = async () => {
      console.log("We have entered iterateLetterBoxes");
      const boxRef = collection(db, "letterbox");
      const q = query(boxRef);
      const querySnapshot = await getDocs(q, limit(5))
  
      querySnapshot.forEach(doc => {
          // console.log("this is the chatId", doc.id);
          deadChat(doc);
        }
      )
  }
  
 




