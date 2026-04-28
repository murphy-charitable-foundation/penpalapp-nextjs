import { addDoc, collection, doc, getDoc, getDocs, limit, orderBy, query, startAfter, updateDoc, where, arrayUnion, increment } from "firebase/firestore"
import { ref as storageRef, getDownloadURL } from "@firebase/storage";
import { storage } from "../firebaseConfig.js";
import { auth, db } from "../firebaseConfig.js"
import { logError } from "./analytics.js";

const DELAY = 1000;

const getUserDoc = async () => {
  const userDocRef = doc(collection(db, "users"), auth.currentUser.uid);
  const userDocSnapshot = await getDoc(userDocRef);
  return { userDocRef, userDocSnapshot };
};

export const getUserPfp = async(uid) => {
  const path = `profile/${uid}/profile-image`;
  try {
    const photoRef = storageRef(storage, path);
    const downloaded = await getDownloadURL(photoRef)
    return downloaded;
  } catch (error) {
    // Return null if there is no profile; default should be handled by UI
    if (error.code === 'storage/object-not-found') {
      return null;
    }
    logError(error, {
      description: "Error fetching user profile:",
    });
    // Returns null for all other errors so it only has one fallback mechanism
    return null;
  }
  
}

export const fetchConversations = async () => {
  const retryFetch = () => setTimeout(() => fetchConversations(), DELAY);

  if (!auth.currentUser?.uid) {
    retryFetch();
    return;
  }
  const { userDocRef, userDocSnapshot } = await getUserDoc();
  if (!userDocSnapshot.exists()) return;

  const conversationsQuery = query(
    collection(db, "conversations"),
    where("members", "array-contains", userDocRef)
  );
  const conversationsQuerySnapshot = await getDocs(conversationsQuery);
  const conversations = conversationsQuerySnapshot.docs;
  return conversations;
};

export const fetchConversationbyId = async (id, lim = false, lastVisible = null) => {
  const retryFetch = () =>
    setTimeout(() => fetchConversationbyId(id, lim, lastVisible), DELAY);

  if (!auth.currentUser?.uid) {
    retryFetch();
    return;
  }
  const { userDocSnapshot } = await getUserDoc();

  if (!userDocSnapshot.exists()) return;

  const conversationsRef = doc(collection(db, "conversations"), id);
  const messagesRef = collection(conversationsRef, "messages");
  let conversationsQuery;

  // TODO temporarily disable moderation until it is developed
  if (lim) {
    conversationsQuery = lastVisible
      ? query(
          messagesRef,
          where("status", "==", "sent"),
          orderBy("created_at", "desc"),
          startAfter(lastVisible),
          limit(lim)
        )
      : query(
          messagesRef,
          where("status", "==", "sent"),
          orderBy("created_at", "desc"),
          limit(lim)
        );
  } else {
    conversationsQuery = lastVisible
      ? query(
          messagesRef,
          where("status", "==", "sent"),
          orderBy("created_at", "desc"),
          startAfter(lastVisible)
        )
      : query(
          messagesRef,
          where("status", "==", "sent"),
          orderBy("created_at", "desc")
        );
  }

  /*if (lim) {
    conversationsQuery = lastVisible
      ? query(lRef, orderBy("created_at", "desc"), startAfter(lastVisible), limit(lim))
      : query(lRef, orderBy("created_at", "desc"), limit(lim));
  } else {
    conversationsQuery = lastVisible
      ? query(lRef, orderBy("created_at", "desc"), startAfter(lastVisible))
      : query(lRef, orderBy("created_at", "desc"));
  }*/

  try {
    const messagesSnapshot = await getDocs(conversationsQuery);
    const messages = messagesSnapshot.docs
      .map((doc) => {
        return { id: doc.id, ...doc.data() };
      })
      .filter((conversationsData) => conversationsData.status != "draft");

    const lastDoc = messagesSnapshot.docs[messagesSnapshot.docs.length - 1];
    return {
      messages: messages.length ? messages : [],
      lastVisible: lastDoc,
    };
  } catch (e) {
    logError(e, {
      description: "Error fetching conversation: ",
    });
    return {
      messages: [],
      lastVisible: null,
    };
  }
};

export const fetchDraft = async (id, userRef, createNew = false) => {
  const conversationsRef = doc(collection(db, "conversations"), id);
  const lRef = collection(conversationsRef, "messages");
  const conversationsQuery = query(
    lRef,
    where("sent_by", "==", userRef),
    where("status", "==", "draft"),
    where("content", "!=", ""),
    limit(1)
  );
  const draftSnapshot = await getDocs(conversationsQuery);
  if (draftSnapshot.docs?.[0]?.data()) {
    return {
      ...draftSnapshot.docs?.[0].data(),
      id: draftSnapshot.docs?.[0].id,
    };
  }

  let draft;
  if (draftSnapshot.docs?.[0]?.data()) {
    draft = {
      ...draftSnapshot.docs?.[0].data(),
      id: draftSnapshot.docs?.[0].id,
    };
  } else if (createNew) {
    const d = await addDoc(lRef, {
      sent_by: userRef,
      content: "",
      status: "draft",
      created_at: new Date(),
      deleted: null,
    });
    draft = {
      sent_by: userRef,
      content: "",
      status: "draft",
      created_at: new Date(),
      id: d.id,
      deleted: null,
    };
  }
  return draft;
};

export const fetchLatestMessageFromConversationOld = async (
  conversationsId,
  userRef
) => {
  const draft = await fetchDraft(conversationsId, userRef, false);
  if (draft) return draft;

  const messagesRef = collection(db, "conversations", conversationsId, "messages");
  const q = query(
    messagesRef,
    where("status", "==", "sent"),
    orderBy("created_at", "desc"),
    limit(1)
  );
  const messageSnapshot = await getDocs(q);
  let message;
  messageSnapshot.forEach((doc) => {
    message = { id: doc.id, ...doc.data() };
  });
  return message;
};

export const fetchLatestMessageFromConversations = async (conversationsId, userRef) => {
  const conversationsRef = doc(collection(db, "conversations"), conversationsId);
  const messagesRef = collection(conversationsRef, "messages");

  try {
    // Query user's latest message
    const userQuery = query(
      messagesRef,
      where("sent_by", "==", userRef),
      where("content", "!=", ""),
      orderBy("created_at", "desc"),
      limit(1)
    );

    // Query latest sent message from other members
    const sentQuery = query(
      messagesRef,
      where("status", "==", "sent"),
      where("content", "!=", ""),
      orderBy("created_at", "desc"),
      limit(1)
    );

    const [userSnap, sentSnap] = await Promise.all([
      getDocs(userQuery),
      getDocs(sentQuery),
    ]);

    const allMessages = [];

    if (!userSnap.empty) {
      allMessages.push({ id: userSnap.docs[0].id, ...userSnap.docs[0].data() });
    }

    if (!sentSnap.empty) {
      const sentMessage = { id: sentSnap.docs[0].id, ...sentSnap.docs[0].data() };
      if (sentMessage.sent_by?.id !== userRef?.id) {
        allMessages.push(sentMessage);
      }
    }

    if (allMessages.length === 0) return null;
    if (allMessages.length === 1) return allMessages[0];

    // Return the most recent message
    const date1 = allMessages[0]?.created_at?.toDate?.() || allMessages[0]?.created_at || new Date(0);
    const date2 = allMessages[1]?.created_at?.toDate?.() || allMessages[1]?.created_at || new Date(0);

    return date1 > date2 ? allMessages[0] : allMessages[1];
  } catch (error) {
    logError(error, { description: "Error fetching latest message from conversation" });
    return null;
  }
};

export const fetchRecipients = async (id) => {
  const conversationsRef = doc(collection(db, "conversations"), id);
  const conversations = await getDoc(conversationsRef);

  const retryFetch = () => setTimeout(() => fetchRecipients(id), DELAY);
  if (!auth.currentUser?.uid) {
    retryFetch();
    return;
  }

  const currentUserUid = auth.currentUser.uid;

  const users = conversations.data().members.filter((m) => m.id !== currentUserUid);
  const members = [];

  for (const user of users) {
    const selectedUserDocRef = doc(db, "users", user.id);
    const selUser = await getDoc(selectedUserDocRef);
    const userData = selUser.data();    // utility/helper variable

    // Call the only source of profile
    const pfpUrl = await getUserPfp(user.id);

    // Push the data; if pfpUrl is null, pfp is null as well; UI should handle the default
    members.push({ ...userData, id: user.id, pfp: pfpUrl });
  }
  return members;
};

let sendingMessage = false;
export const sendMessage = async (messageData, messageRef, draftId) => {
  if (sendingMessage) return;
  try {
    sendingMessage = true;
    await updateDoc(doc(messageRef, draftId), messageData);
    sendingMessage = false;
    return true;
  } catch (e) {
    logError(e, {
      description: "Failed to send message: ",
    });
    sendingMessage = false;
    return false;
  }
};

export const sendNotification = async (conversationsRef, message) => {
  // Verify that the user is authenticated.
  if (!auth.currentUser) {
    console.error("User not authenticated.");
    return;
  }

  // Validate conversationRef parameter.
  if (!conversationsRef || !conversationsRef.id) {
    console.error("Invalid conversationsRef: missing or has no id property.");
    return;
  }

  try {
    // Retrieve Firebase Auth ID token for authorization.
    const idToken = await auth.currentUser.getIdToken();

    // Retrieve the conversations (conversations) ID.
    const conversationsId = conversationsRef.id;

    // Build payload.
    const payload = {
      conversationsId: conversationsId,
      message: message,
    };

    // Send to notify API with auth header.
    const response = await fetch("/api/notify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Failed to send notifications:", result.error);
      return result;
    }

    console.log("Notifications sent successfully:", result);
    return result;
  } catch (e) {
    console.error("Error in sendNotification:", e);
    return { error: e.message };
  }
};

export const createConnection = async (userDocRef, kidDocRef) => {
    try {
        const kidSnap = await getDoc(kidDocRef);
        const buddySnap = await getDoc(userDocRef);
        
          if (!kidSnap.exists() && !buddySnap.exists()) {
            logError(error, {
              description: "Neither of child nor international buddy exist in the users collection: ",
            })
            throw new Error("Neither of child nor international buddy exist in the users collection");
          }
          console.log("Kid:", kidSnap);
          console.log("User:", buddySnap);

          if (kidSnap.exists()) {
            if (kidSnap.data().connected_penpals_count >= 3) {
              throw new Error("Kid has exceeded penpal limit");
            }
            await updateDoc(kidDocRef, {
              connected_penpals: arrayUnion(userDocRef),
              connected_penpals_count: increment(1),
            });
          }

          if (buddySnap.exists()) {
            await updateDoc(userDocRef, {
              connected_penpals: arrayUnion(kidDocRef),
              connected_penpals_count: increment(1),
            });
          }

          // query DB to check for existing conversations
          let conversationsQuery = query(
            collection(db, "conversations"),
            where("members", "==", [userDocRef, kidDocRef]) // Use reference, not string
          );

          let querySnapshot = await getDocs(conversationsQuery);
          
          if (querySnapshot.empty) {
            conversationsQuery = query(
              collection(db, "conversations"),
              where("members", "==", [kidDocRef, userDocRef])
            );
            querySnapshot = await getDocs(conversationsQuery);
          }

          let conversationsRef;

          if (querySnapshot.empty) { // if there's no conversation, create one.
            conversationsRef = await addDoc(collection(db, "conversations"), {
              members: [
                userDocRef, 
                kidDocRef   
              ],
              created_at: new Date(),
              archived_at: null,
            });

            await addDoc(collection(conversationsRef, "messages"), {
              sent_by: userDocRef,
              content: "Please complete your first message here...",
              status: "draft",
              drafted_at: new Date(),
              created_at: new Date(),
              deleted: null
            });

            console.log(conversationsRef);
            return conversationsRef;
          } else {
            // Penpal and kid are already connected, do nothing
            return querySnapshot.ref;
          }
    } catch (error) {
      logError("There has been a error creating the connection: " + error.message, { error });
      throw error; // rethrow so callers can handle it
    }
  };
