import { addDoc, collection, doc, getDoc, getDocs, limit, orderBy, query, startAfter, updateDoc, where, arrayUnion, increment, setDoc } from "firebase/firestore"
import { ref as storageRef, getDownloadURL } from "@firebase/storage";
import { storage } from "../firebaseConfig.js";
import { auth, db } from "../firebaseConfig"
import { logError } from "../utils/analytics";

const DELAY = 1000;
const EMPTY_QUERY_SNAPSHOT = { empty: true, docs: [] };

const safeGetDocs = async (queryRef, context) => {
  try {
    return await getDocs(queryRef);
  } catch (error) {
    logError(error, {
      description: context,
    });
    return EMPTY_QUERY_SNAPSHOT;
  }
};

const hasMessageAttachments = (message = {}) =>
  message.has_attachments === true ||
  (Array.isArray(message.attachments) && message.attachments.length > 0) ||
  Boolean(message.media_url);

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
    where("members", "array-contains", userDocRef),
    where("deleted_at", '==', null)
  );
  const conversationQuerySnapshot = await getDocs(conversationQuery);
  const conversations = conversationQuerySnapshot.docs;
  return conversations;
};

export const fetchConversation = async (
  id,
  lim = false,
  lastVisible = null,
  options = {}
) => {
  const { attachmentsOnly = false } = options;
  const retryFetch = () =>
    setTimeout(() => fetchConversation(id, lim, lastVisible, options), DELAY);

  if (!auth.currentUser?.uid) {
    retryFetch();
    return;
  }
  const { userDocSnapshot } = await getUserDoc();

  if (!userDocSnapshot.exists()) return;

  const conversationRef = doc(collection(db, "conversations"), id);
  const lRef = collection(conversationRef, "messages");
  const queryConstraints = [
    where("status", "==", "approved"),
    ...(attachmentsOnly ? [where("has_attachments", "==", true)] : []),
    orderBy("created_at", "desc"),
  ];
  let conversationQuery;

  if (lim) {
    conversationQuery = lastVisible
      ? query(lRef, ...queryConstraints, startAfter(lastVisible), limit(lim))
      : query(lRef, ...queryConstraints, limit(lim));
  } else {
    conversationQuery = lastVisible
      ? query(lRef, ...queryConstraints, startAfter(lastVisible))
      : query(lRef, ...queryConstraints);
  }

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

export const fetchAttachmentMessages = async (
  id,
  lim = false,
  lastVisible = null
) => fetchConversation(id, lim, lastVisible, { attachmentsOnly: true });

export const fetchDraft = async (id, userRef, createNew = false) => {
  try {
    const conversationRef = doc(db, "conversations", id);
    const messagesRef = collection(conversationRef, "messages");

    const contentDraftQuery = query(
      messagesRef,
      where("sent_by", "==", userRef),
      where("status", "==", "draft"),
      where("content", "!=", ""),
      orderBy("drafted_at", "desc"),
      limit(1),
    );

    const attachmentDraftQuery = query(
      messagesRef,
      where("sent_by", "==", userRef),
      where("status", "==", "draft"),
      where("has_attachments", "==", true),
      orderBy("drafted_at", "desc"),
      limit(1),
    );

    const latestDraftQuery = query(
      messagesRef,
      where("sent_by", "==", userRef),
      where("status", "==", "draft"),
      orderBy("drafted_at", "desc"),
      limit(10),
    );

    const [contentDraftSnapshot, attachmentDraftSnapshot, latestDraftSnapshot] = await Promise.all([
      safeGetDocs(contentDraftQuery, "Error fetching content draft:"),
      safeGetDocs(attachmentDraftQuery, "Error fetching attachment draft:"),
      safeGetDocs(latestDraftQuery, "Error fetching latest drafts fallback:"),
    ]);

    const latestDraftDoc = [
      contentDraftSnapshot.docs[0],
      attachmentDraftSnapshot.docs[0],
      ...(latestDraftSnapshot.docs || []).filter((docSnap) => {
        const data = docSnap.data();
        return Boolean((data.content || "").trim()) || hasMessageAttachments(data);
      }),
    ]
      .filter(Boolean)
      .sort(
        (a, b) =>
          (b.data().drafted_at?.toDate?.() || new Date(0)) -
          (a.data().drafted_at?.toDate?.() || new Date(0))
      )[0];

    if (latestDraftDoc) {
      const draftDoc = latestDraftDoc;

      return {
        id: draftDoc.id,
        ...draftDoc.data(),
        drafted_at: draftDoc.data().drafted_at?.toDate?.() || null,
      };
    }

    if (createNew) {
      const now = new Date();
      const newDraftData = {
        sent_by: userRef,
        content: "",
        status: "draft",
        drafted_at: now,
        unread: true,
        attachments: [],
        has_attachments: false,
      };

      const newDraftRef = doc(messagesRef);
      await setDoc(newDraftRef, newDraftData);

      return {
        id: newDraftRef.id,
        ...newDraftData,
      };
    }

    return null;
  } catch (error) {
    logError(error, {
      description: "Error fetching draft:",
    });
    return null;
  }
};

export const fetchLatestMessageFromConversation = async (
  conversationId,
  userRef
) => {
  const conversationRef = doc(collection(db, "conversations"), conversationId);
  const messagesRef = collection(conversationRef, "messages");

  const toDate = (value) =>
    value?.toDate?.() || (value instanceof Date ? value : new Date(0));

  const getBestMessageDate = (data = {}, preferredField) => {
    const preferred = toDate(data?.[preferredField]);
    const created = toDate(data?.created_at);
    const drafted = toDate(data?.drafted_at);
    const moderated = toDate(data?.moderated_at);

    return [preferred, created, drafted, moderated].reduce(
      (latest, current) => (current > latest ? current : latest),
      new Date(0)
    );
  };

  const hasRenderableMessage = (data = {}) => {
    const hasContent = Boolean((data.content || "").trim());
    const hasAttachments = hasMessageAttachments(data);
    return hasContent || hasAttachments;
  };

  const getFirstMessage = (snap, dateField) => {
    if (snap.empty) return null;

    const messageDoc = snap.docs.find((docSnap) => {
      const data = docSnap.data();
      return hasRenderableMessage(data);
    });

    if (!messageDoc) return null;

    const data = messageDoc.data();

    return {
      id: messageDoc.id,
      ...data,
      lastMessageDate: getBestMessageDate(data, dateField),
    };
  };

  const getLatestFromSnaps = (snaps, dateField) =>
    snaps
      .map((snap) => getFirstMessage(snap, dateField))
      .filter(Boolean)
      .reduce(
        (latest, message) =>
          !latest || message.lastMessageDate > latest.lastMessageDate
            ? message
            : latest,
        null
      );

  const userContentQuery = query(
    messagesRef,
    where("sent_by", "==", userRef),
    where("content", "!=", ""),
    orderBy("drafted_at", "desc"),
    limit(1)
  );

  const userAttachmentQuery = query(
    messagesRef,
    where("sent_by", "==", userRef),
    where("has_attachments", "==", true),
    orderBy("drafted_at", "desc"),
    limit(1)
  );

  const userLatestFallbackQuery = query(
    messagesRef,
    where("sent_by", "==", userRef),
    orderBy("drafted_at", "desc"),
    limit(10)
  );

  const approvedQuery = query(
    messagesRef,
    where("status", "==", "approved"),
    orderBy("moderated_at", "desc"),
    limit(1)
  );

  const approvedAttachmentQuery = query(
    messagesRef,
    where("status", "==", "approved"),
    where("has_attachments", "==", true),
    orderBy("moderated_at", "desc"),
    limit(1)
  );

  const approvedLatestFallbackQuery = query(
    messagesRef,
    where("status", "==", "approved"),
    orderBy("moderated_at", "desc"),
    limit(10)
  );

  const rejectedQuery = query(
    messagesRef,
    where("sent_by", "==", userRef),
    where("status", "==", "rejected"),
    orderBy("moderated_at", "desc"),
    limit(1)
  );

  const rejectedAttachmentQuery = query(
    messagesRef,
    where("sent_by", "==", userRef),
    where("status", "==", "rejected"),
    where("has_attachments", "==", true),
    orderBy("moderated_at", "desc"),
    limit(1)
  );

  const rejectedLatestFallbackQuery = query(
    messagesRef,
    where("sent_by", "==", userRef),
    where("status", "==", "rejected"),
    orderBy("moderated_at", "desc"),
    limit(10)
  );

  const [
    userConversationsSnap,
    userAttachmentConversationsSnap,
    approvedConversationsSnap,
    approvedAttachmentConversationsSnap,
    approvedLatestFallbackSnap,
    rejectedConversationsSnap,
    rejectedAttachmentConversationsSnap,
    rejectedLatestFallbackSnap,
    userLatestFallbackSnap,
  ] = await Promise.all([
    safeGetDocs(userContentQuery, "Error fetching latest user content message:"),
    safeGetDocs(userAttachmentQuery, "Error fetching latest user attachment message:"),
    safeGetDocs(approvedQuery, "Error fetching latest approved message:"),
    safeGetDocs(approvedAttachmentQuery, "Error fetching latest approved attachment message:"),
    safeGetDocs(approvedLatestFallbackQuery, "Error fetching latest approved fallback messages:"),
    safeGetDocs(rejectedQuery, "Error fetching latest rejected message:"),
    safeGetDocs(rejectedAttachmentQuery, "Error fetching latest rejected attachment message:"),
    safeGetDocs(rejectedLatestFallbackQuery, "Error fetching latest rejected fallback messages:"),
    safeGetDocs(userLatestFallbackQuery, "Error fetching latest user fallback messages:"),
  ]);

  const latestUserMessage = getLatestFromSnaps(
    [userConversationsSnap, userAttachmentConversationsSnap, userLatestFallbackSnap],
    "drafted_at"
  );

  const latestApprovedMessage = getLatestFromSnaps(
    [approvedConversationsSnap, approvedAttachmentConversationsSnap, approvedLatestFallbackSnap],
    "moderated_at"
  );

  const latestRejectedMessage = getLatestFromSnaps(
    [rejectedConversationsSnap, rejectedAttachmentConversationsSnap, rejectedLatestFallbackSnap],
    "moderated_at"
  );

  const latestSentMessage =
    latestApprovedMessage?.sent_by?.id !== userRef?.id
      ? latestApprovedMessage
      : null;

  return [latestUserMessage, latestSentMessage, latestRejectedMessage]
    .filter(Boolean)
    .reduce(
      (latest, message) =>
        !latest || message.lastMessageDate > latest.lastMessageDate
          ? message
          : latest,
      null
    );
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
            where("members", "==", [userDocRef, kidDocRef]), // Use reference, not string
            where("deleted_at", '==', null)
          );

          let querySnapshot = await getDocs(conversationQuery);
          
          if (querySnapshot.empty) {
            conversationQuery = query(
              collection(db, "conversations"),
              where("members", "==", [kidDocRef, userDocRef]),
              where("deleted_at", '==', null)
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
              deleted_at: null,
            });

            const now = new Date();
            await addDoc(collection(conversationRef, "messages"), {
              sent_by: userDocRef,
              content: "Please complete your first message here...",
              status: "draft",
              drafted_at: now,
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
