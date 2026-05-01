import { db } from "../firebaseConfig";
import { collection, collectionGroup, getDocs, getDoc, doc, query, where} from "firebase/firestore";
import { dateToTimestamp } from "./dateHelpers";
import { logError } from "../utils/analytics";


const apiRequest = async (conversations, emailId, reason) => {
  try {
      let response;
      if (reason == "admin") {
        const ids = conversations.members.map((member) => {
          const segments = member._key?.path?.segments;
          return segments?.[segments.length - 1];
          
        });
        let userData = [];
        const sender = await getDoc(doc(db, "users", ids[0]));
        userData.push(sender.data());
        const sender2 = await getDoc(doc(db, "users", ids[1]))
        userData.push(sender2.data());
        
        response = await fetch('/api/deadchat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sender: userData, id: conversations.id, emailId, reason: reason}), // Send data as JSON
        });
      } else {
        const ids = conversations.members.map((member) => {
          const segments = member._key?.path?.segments;
          if (segments?.[segments.length - 1] != emailId) {
            return segments?.[segments.length - 1];
          }
        });
        const sender = await getDoc(doc(db, "users", ids[0]));
        
        response = await fetch('/api/deadchat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sender: sender, id: conversations.id, emailId, reason: reason}), // Send data as JSON
        });
      }
      
        
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
       
  } catch (error) {
    logError(error, { description: "Could not send request to email client:", error});
  }
}


  export const iterateConversations = async () => {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    // Convert oneMonthAgo to Firestore Timestamp using dateToTimestamp
    const oneMonthAgoTimestamp = dateToTimestamp(oneMonthAgo);

    //Two indexes needed for this query but keeps read calls down.
    const allLettersQuery = query(
        collectionGroup(db, "letters"), 
        where("status", "==", "sent"),
        where("created_at", ">=", oneMonthAgoTimestamp), // Use Firestore Timestamp here
    );

    const querySnapshot = await getDocs(allLettersQuery);
    const conversations = {}; 

    const documents = querySnapshot.docs.map(doc => ({
        id: doc.id,
        refPath: doc.ref.path, // Store path explicitly
        ...doc.data()
    }));

    documents.forEach((doc) => {
      const pathSegments = doc.refPath.split("/");
      const conversationsId = pathSegments[1];
  
      if (!conversations[conversationsId]) {
        conversations[conversationsId] = {};
      }
  
      if (!conversations[conversationsId][doc.sent_by]) {
        conversations[conversationsId][doc.sent_by] = [];
      }
  
      conversations[conversationsId][doc.sent_by].push(doc);
    });
  
    const conversationsSnapshot = await getDocs(collection(db, "conversations"));
    const conversationsDocuments = conversationsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const now = new Date();
    const twoWeeksAgo = new Date(now);
    twoWeeksAgo.setDate(now.getDate() - 14);
  
    for (const conversations of conversationsDocuments) {
      const id = conversations.id;
      const members = conversations.members || [];
  
      const activityMap = conversationses[id] || {};
  
      for (const member of members) {
        const lettersByMember = activityMap[member] || [];
  
        const lastSentDate = lettersByMember
          .map((letter) => letter.created_at?.toDate?.())
          .filter((d) => !!d)
          .sort((a, b) => b - a)[0]; // Most recent
  
          if (!lastSentDate) {
            // User has sent nothing in the last month
            await apiRequest(conversations, member, "user");
            await apiRequest(conversations, member, "admin");
          } else if (lastSentDate < twoWeeksAgo) {
            // User sent something between 2 weeks ago to 1 month ago 
            await apiRequest(conversations, member, "user");
          }
      }
    }
}; 