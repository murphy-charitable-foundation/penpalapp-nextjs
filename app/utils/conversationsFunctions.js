import { addDoc, collection, doc, getDoc, getDocs, limit, orderBy, query, startAfter, updateDoc, where } from "firebase/firestore"
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
  console.log("inside fetchConversations of the utils/conversationsFunctions.js")
  const retryFetch = () => setTimeout(() => fetchConversations(), DELAY);

  if (!auth.currentUser?.uid) {
    retryFetch();
    return;
  }
  const { userDocRef, userDocSnapshot } = await getUserDoc();
  console.log("got userDocRef and userDocSnapshot in fetchConversations of the utils/conversationsFunctions.js")
  console.log(userDocRef, userDocSnapshot)
  if (!userDocSnapshot.exists()) return;

  console.log("after userDocSnapshot.exists() check in fetchConversations of the utils/conversationsFunctions.js")
  const conversationsQuery = query(
    collection(db, "conversations"),
    where("members", "array-contains", userDocRef)
  );
  console.log("conversationsQuery in fetchConversations of the utils/conversationsFunctions.js")
  console.log(conversationsQuery)

  /// adding this to test 
  try {
  const conversationsQuerySnapshot = await getDocs(conversationsQuery);
  console.log("after getDocs", conversationsQuerySnapshot);
} catch (e) {
  console.error("getDocs failed:", e);
}
  //this is the one that is not working ... 
  const conversationsQuerySnapshot = await getDocs(conversationsQuery);

  console.log("got conversationsQuerySnapshot in fetchConversations of the utils/conversationsFunctions.js")
  console.log(conversationsQuerySnapshot)
  const conversations = conversationsQuerySnapshot.docs;
  return conversations;
};

export const fetchConversationById = async (id, lim = false, lastVisible = null) => {
  const retryFetch = () =>
    setTimeout(() => fetchConversationById(id, lim, lastVisible), DELAY);

  if (!auth.currentUser?.uid) {
    retryFetch();
    return;
  }
  const { userDocSnapshot } = await getUserDoc();

  if (!userDocSnapshot.exists()) return;

  const conversationsRef = doc(collection(db, "conversations"), id);
  const lRef = collection(conversationsRef, "messages");
  let conversationsQuery;

  // TODO temporarily disable moderation until it is developed
  if (lim) {
    conversationsQuery = lastVisible
      ? query(
          lRef,
          where("status", "==", "sent"),
          orderBy("created_at", "desc"),
          startAfter(lastVisible),
          limit(lim)
        )
      : query(
          lRef,
          where("status", "==", "sent"),
          orderBy("created_at", "desc"),
          limit(lim)
        );
  } else {
    conversationsQuery = lastVisible
      ? query(
          lRef,
          where("status", "==", "sent"),
          orderBy("created_at", "desc"),
          startAfter(lastVisible)
        )
      : query(
          lRef,
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
      description: "Error fetching conversations: ",
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

export const fetchLatestMessageFromConversationsOld = async (
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
  const lRef = collection(conversationsRef, "messages");

  // My Messages
  const userMessagesQuery = query(
    lRef,
    where("sent_by", "==", userRef),
    where("content", "!=", ""),
    orderBy("updated_at", "desc"),
    limit(1) // grab a few in case of fallback
  );

  // Your messages
  const sentMessagesQuery = query(
    lRef,
    where("status", "==", "sent"),
    where("content", "!=", ""),
    orderBy("updated_at", "desc"),
    limit(1)
  );

  // Run both in parallel
  const [userMessagesSnap, sentMessagesSnap] = await Promise.all([
    getDocs(userMessagesQuery),
    getDocs(sentMessagesQuery),
  ]);

  const allMessages = [];

  if (!userMessagesSnap?.empty)
    userMessagesSnap.forEach((doc) => {
      allMessages.push({ id: doc?.id, ...doc?.data() });
    });

  if (!sentMessagesSnap?.empty)
    sentMessagesSnap.forEach((doc) => {
      if (doc?.data()?.sent_by?.id !== userRef?.id)
        allMessages.push({ id: doc?.id, ...doc?.data() });
    });

  if (allMessages.length === 0) return null;
  else if (allMessages.length === 1) return allMessages[0];
  else if (
    allMessages[0]?.updated_at?.toDate?.() >
    allMessages[1]?.updated_at?.toDate?.()
  )
    return allMessages[0];
  else return allMessages[1];
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
