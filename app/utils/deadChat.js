import { db } from "../firebaseConfig";
import { limit } from "firebase/firestore";
import { collection, query, orderBy, getDocs, getDoc} from "firebase/firestore";
import {useEffect, useState} from "react";
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
  // If not, return an invalid date (optional safety check)
  return new Date(NaN);
}

const deadChat = async (chat) => {
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
    
    
    const mostRecentChat = chats.reduce((latest, current) => {
        return new Date(getDateFromTimestamp(current.created_at)) > new Date(getDateFromTimestamp(latest.created_at)) ? current : latest;
    }, chats[0]);

    const mostRecentDate = new Date(getDateFromTimestamp(mostRecentChat.created_at));
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    if (mostRecentDate < oneMonthAgo) {
      await apiRequest(chatData.members, chat.id);
    } 
  } catch (error) {
    Sentry.captureException("Error checking the dates of chats");
  }
 
}

export const iterateLetterBoxes = async () => {
    //Grab letter boxes and iterate through them
    const boxRef = collection(db, "letterbox")

    const q = query(boxRef);

    const querySnapshot = await getDocs(q)
    
    querySnapshot.forEach(doc => {
        deadChat(doc);
      }
    )
}


