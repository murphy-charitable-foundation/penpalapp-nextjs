import { db } from "../../lib/firebase"; // Firestore database object
import { collection, query, orderBy, getDocs } from "firebase/firestore";




async function deadChat(chatId) {
  try {
    const lettersRef = collection(db, "letterbox", chatId, "letters");

    const q = query(lettersRef, orderBy("createdTime", "desc"));

    const querySnapshot = await getDocs(q);

    // Process the data
    const chats = [];
    querySnapshot.forEach(doc => {
      chats.push({ id: doc.id, ...doc.data() });
    });

    
    const mostRecentChat = chats.reduce((latest, current) => {
        return new Date(current.createdTime) > new Date(latest.createdTime) ? current : latest;
    }, chats[0]);

    const mostRecentDate = new Date(mostRecentChat.createdTime);
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    if (mostRecentDate < oneMonthAgo) {
    console.log("The most recent message is more than a month old.");
    } else {
    console.log("The most recent message is within the last month.");
    }
  } catch (error) {
    console.error("Error fetching chats:", error);
  }
 
}

const iterateLetterBoxes = async () => {
    const boxRef = collection(db, "letterbox")

    const q = query(boxRef);

    const querySnapshot = await getDocs(q, limit(5))

    querySnapshot.forEach(doc => {
        deadChat(doc);
        }
    )
}


export default iterateLetterBoxes;