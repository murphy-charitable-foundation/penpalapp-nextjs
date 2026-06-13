import { addDoc, collection, doc, getDoc, getDocs, limit, orderBy, query, startAfter, updateDoc, where, arrayUnion, increment } from "firebase/firestore"
import { ref as storageRef, getDownloadURL } from "@firebase/storage";
import { storage } from "../firebaseConfig.js";
import { auth, db } from "../firebaseConfig"
import { logError } from "../utils/analytics";

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

  const conversationQuery = query(
    collection(db, "conversations"),
    where("members", "array-contains", userDocRef)
  );
  const conversationQuerySnapshot = await getDocs(conversationQuery);
  const conversations = conversationQuerySnapshot.docs;
  return conversations;
};

export const fetchConversation = async (id, lim = false, lastVisible = null) => {
  const retryFetch = () =>
    setTimeout(() => fetchConversation(id, lim, lastVisible), DELAY);

  if (!auth.currentUser?.uid) {
    retryFetch();
    return;
  }
  const { userDocSnapshot } = await getUserDoc();

  if (!userDocSnapshot.exists()) return;

  const conversationRef = doc(collection(db, "conversations"), id);
  const lRef = collection(conversationRef, "messages");
  let conversationQuery;

  // TODO temporarily disable moderation until it is developed
  if (lim) {
    conversationQuery = lastVisible
      ? query(
          lRef,
          where("status", "==", "approved"),
          orderBy("created_at", "desc"),
          startAfter(lastVisible),
          limit(lim)
        )
      : query(
          lRef,
          where("status", "==", "approved"),
          orderBy("created_at", "desc"),
          limit(lim)
        );
  } else {
    conversationQuery = lastVisible
      ? query(
          lRef,
          where("status", "==", "approved"),
          orderBy("created_at", "desc"),
          startAfter(lastVisible)
        )
      : query(
          lRef,
          where("status", "==", "approved"),
          orderBy("created_at", "desc")
        );
  }

  /*if (lim) {
    conversationQuery = lastVisible
      ? query(lRef, orderBy("created_at", "desc"), startAfter(lastVisible), limit(lim))
      : query(lRef, orderBy("created_at", "desc"), limit(lim));
  } else {
    conversationQuery = lastVisible
      ? query(lRef, orderBy("created_at", "desc"), startAfter(lastVisible))
      : query(lRef, orderBy("created_at", "desc"));
  }*/

  try {
    const messagesSnapshot = await getDocs(conversationQuery);
    const messages = messagesSnapshot.docs
      .map((doc) => {
        return { id: doc.id, ...doc.data() };
      })
      .filter((conversationData) => conversationData.status != "draft");

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
  const conversationRef = doc(collection(db, "conversations"), id);
  const lRef = collection(conversationRef, "messages");
  const conversationQuery = query(
    lRef,
    where("sent_by", "==", userRef),
    where("status", "==", "draft"),
    where("content", "!=", ""),
    limit(1)
  );
  const draftSnapshot = await getDocs(conversationQuery);
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
  conversationId,
  userRef
) => {
  const draft = await fetchDraft(conversationId, userRef, false);
  if (draft) return draft;

  const messagesRef = collection(db, "conversations", conversationId, "messages");
  const q = query(
    messagesRef,
    where("status", "==", "approved"),
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

export const fetchLatestMessageFromConversation = async (conversationId, userRef) => {
  const conversationRef = doc(collection(db, "conversations"), conversationId);
  const lRef = collection(conversationRef, "messages");

  // Query with fallback in case no result for drafted_at
  const getLatestByFieldFallback = async (constraints) => {

    // initial query to check existence of the new field drafted_at
    const draftedQuery = query (
      lRef,
      ...constraints,
      orderBy("drafted_at", "desc"),
      limit(1)
    );
    
    const draftedSnap = await getDocs(draftedQuery);
    
    return draftedSnap;
  };

  // Run both in parallel
  const [userConversationsSnap, sentConversationsSnap] = await Promise.all([
    getLatestByFieldFallback([
      where("sent_by", "==", userRef),
      where("content", "!=", ""),
    ]),
    getLatestByFieldFallback([
      where("status", "==", "approved"),
      where("content", "!=", ""),
    ]),
  ]);

  const allConversations = [];

  if (!userConversationsSnap?.empty)
    userConversationsSnap.forEach((doc) => {
      allConversations.push({ id: doc?.id, ...doc?.data() });
    });

  if (!sentConversationsSnap?.empty)
    sentConversationsSnap.forEach((doc) => {
      if (doc?.data()?.sent_by?.id !== userRef?.id)
        allConversations.push({ id: doc?.id, ...doc?.data() });
    });
  // Use drafted_at for new docs, and created_at for old as fallback
  const getMessageDate = (message) => 
    message?.drafted_at?.toDate?.() ||
    message?.created_at?.toDate?.() ||
    new Date(0);
  

  if (allConversations.length === 0) return null;
  if (allConversations.length === 1) return allConversations[0];
  
  return getMessageDate(allConversations[0]) > getMessageDate(allConversations[1]) 
      ? allConversations[0] 
      : allConversations[1];
};

export const fetchRecipients = async (id) => {
  const conversationRef = doc(collection(db, "conversations"), id);
  const conversation = await getDoc(conversationRef);

  const retryFetch = () => setTimeout(() => fetchRecipients(id), DELAY);
  if (!auth.currentUser?.uid) {
    retryFetch();
    return;
  }

  const currentUserUid = auth.currentUser.uid;

  const users = conversation.data().members.filter((m) => m.id !== currentUserUid);
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

export const sendNotification = async (conversationRef, message) => {
  // Verify that the user is authenticated.
  if (!auth.currentUser) {
    console.error("User not authenticated.");
    return;
  }

  // Validate conversationRef parameter.
  if (!conversationRef || !conversationRef.id) {
    console.error("Invalid conversationRef: missing or has no id property.");
    return;
  }

  try {
    // Retrieve Firebase Auth ID token for authorization.
    const idToken = await auth.currentUser.getIdToken();

    // Retrieve the conversation (conversation) ID.
    const conversationId = conversationRef.id;

    // Build payload.
    const payload = {
      conversationId: conversationId,
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

          // query DB to check for existing conversation
          let conversationQuery = query(
            collection(db, "conversations"),
            where("members", "==", [userDocRef, kidDocRef]) // Use reference, not string
          );

          let querySnapshot = await getDocs(conversationQuery);
          
          if (querySnapshot.empty) {
            conversationQuery = query(
              collection(db, "conversations"),
              where("members", "==", [kidDocRef, userDocRef])
            );
            querySnapshot = await getDocs(conversationQuery);
          }

          let conversationRef;

          if (querySnapshot.empty) { // if there's no conversation, create one.
            conversationRef = await addDoc(collection(db, "conversations"), {
              members: [
                userDocRef, 
                kidDocRef   
              ],
              created_at: new Date(),
              archived_at: null,
            });

            const now = new Date();
            await addDoc(collection(conversationRef, "messages"), {
              sent_by: userDocRef,
              content: "Please complete your first message here...",
              status: "draft",
              drafted_at: now,
              created_at: now,
              deleted: null
            });

            console.log(conversationRef);
            return conversationRef;
          } else {
            // Penpal and kid are already connected, do nothing
            return querySnapshot.ref;
          }
    } catch (error) {
      logError("There has been a error creating the connection: " + error.message, { error });
      throw error; // rethrow so callers can handle it
    }
  };