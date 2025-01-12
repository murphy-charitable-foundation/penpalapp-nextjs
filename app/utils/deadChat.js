import { db } from "../firebaseConfig";
import { limit } from "firebase/firestore";
import { collection, query, orderBy, getDocs, getDoc} from "firebase/firestore";
import {useEffect, useState} from "react";
import * as Sentry from "@sentry/nextjs";


const apiRequest = async (emails, id) => {
  try {
      const message = `Hello, it seems that the chat in letterbox with id ${id}, containing the users: ${emails}, has stalled. Consider contacting them to see if the chat can be reignited.`
        
      const response = await fetch('/api/deadchat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }), // Send data as JSON
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
    
    
    const mostRecentChat = chats.reduce((latest, current) => {
        return new Date(getDateFromTimestamp(current.created_at)) > new Date(getDateFromTimestamp(latest.created_at)) ? current : latest;
    }, chats[0]);

    const mostRecentDate = new Date(getDateFromTimestamp(mostRecentChat.created_at))
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    if (mostRecentDate < oneMonthAgo) {
      console.log(1);
      console.log("most recent date:", mostRecentDate);
      console.log(mostRecentChat.created_at)
      console.log("The most recent message is more than a month old.");
      console.log(1);
      const members = chatData.members
      const emails = [];
      for (const member of members) {
        const userSnapshot = await getDoc(member);
        if (userSnapshot.exists()) {
          const userData = userSnapshot.data();
          emails.push(userData.email);
        }
      }
      console.log("emails", emails);
      await apiRequest(emails, chat.id);
    } else {
      console.log(1);
      console.log("most recent date:", mostRecentDate);
      console.log(mostRecentChat.created_at)
      console.log("The most recent message is within the last month.");
      console.log(1);
    }
  } catch (error) {
    console.error("Error fetching chats:", error);
  }
 
}

export const iterateLetterBoxes = async () => {
    console.log("We have entered iterateLetterBoxes")
    const boxRef = collection(db, "letterbox")

    const q = query(boxRef);

    const querySnapshot = await getDocs(q, limit(5))
    
    querySnapshot.forEach(doc => {
        // console.log("this is the chatId", doc.id);
        deadChat(doc);
      }
    )
}


