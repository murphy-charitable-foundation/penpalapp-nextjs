import { db } from "../firebaseConfig";
import { limit } from "firebase/firestore";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import {useEffect, useState} from "react";
import * as Sentry from "@sentry/nextjs";


const apiRequest = async (user1, user2) => {
  try {
      const message = `Hello, it seems that the chat between the user ${user1} and the user ${user2} has stalled. Consider contacting them to see if the chat can be reignited.`
        
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

async function deadChat(chatId) {
  console.log("we have entered deadchat");
  try {
    const lettersRef = collection(db, "letterbox", chatId, "letters");

    const q = query(lettersRef, orderBy("created_at", "desc"));

    const querySnapshot = await getDocs(q);
    console.log("querySnapshot:", querySnapshot);
    // Process the data
    const chats = [];
    querySnapshot.forEach(doc => {
      chats.push({ id: doc.id, ...doc.data() });
    });
    
    
    const mostRecentChat = chats.reduce((latest, current) => {
        return new Date(current.createdTime) > new Date(latest.createdTime) ? current : latest;
    }, chats[0]);

    const mostRecentDate = new Date(mostRecentChat.created_at);
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    if (mostRecentDate < oneMonthAgo) {
      const user1 = "Bob";
      const user2 = "Jill";
      console.log("The most recent message is more than a month old.");
      await apiRequest(user1, user2);
    } else {
      console.log("The most recent message is within the last month.");
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
        console.log("this is the chatId", doc.id);
        deadChat(doc.id);
      }
    )
}


