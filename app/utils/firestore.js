import { collection, doc, getDoc, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";

export const fetchData = async () => {
  if (!auth.currentUser?.uid) {
    console.warn("error loading auth")
    setTimeout(() => {
      fetchData()
    }, 2000)
    return
  }
  const userDocRef = doc(collection(db, "users"), auth.currentUser.uid);
  console.log(auth.currentUser.uid)
  const userDocSnapshot = await getDoc(userDocRef);
  console.log(userDocSnapshot)

  if (userDocSnapshot.exists()) {
    const conversationsQuery = query(collection(db, "conversations"), where("members", "array-contains", userDocRef));
    const conversationsQuerySnapshot = await getDocs(conversationsQuery);

    const messages = [];

    for (const document of conversationsQuerySnapshot.docs) {
      const conversationsData = document.data();
      const conversationsRef = doc(collection(db, "conversations"), document.id);
      const lRef = collection(conversationsRef, "messages");
      const draftQuery = query(
        lRef,
        where("status", "==", "draft"),
        where('sent_by', "==", userDocRef),
        orderBy("created_at"),
        limit(1)
      )
      const draftSnapshot = await getDocs(draftQuery);
      console.log("DRAFT", draftSnapshot)
      if (!draftSnapshot.empty) {
        const queryDocumentSnapshots = draftSnapshot.docs;
        const latestMessage = queryDocumentSnapshots[0].data();
        messages.push({
          conversationsId: document.id,
          collectionId: queryDocumentSnapshots[0].id,
          receiver: conversationsData.members.find(memberRef => memberRef.id !== auth.currentUser.uid).id,
          content: latestMessage.content,
          status: latestMessage.status,
          deleted: latestMessage.deleted_at,
          created_at: latestMessage.created_at,
        });
      } else {
        const conversationsQuery = query(
          lRef,
          where("content", "!=", ''), // Exclude empty messages
          where("deleted", "==", false),
          where("status", "==", "sent"),
          orderBy("created_at")
        );
  
        const snapshot = await getDocs(conversationsQuery);
  
        if (!snapshot.empty) {
          const queryDocumentSnapshots = snapshot.docs;
          const latestMessage = queryDocumentSnapshots[0].data();
          messages.push({
            conversationsId: document.id,
            collectionId: queryDocumentSnapshots[0].id,
            receiver: conversationsData.members.find(memberRef => memberRef.id !== auth.currentUser.uid).id,
            content: latestMessage.content,
            status: latestMessage.status,
            deleted: latestMessage.deleted_at,
            created_at: latestMessage.created_at,
          });
        }
      }
    }
    console.log("msgs", messages)
    return messages
  }
};


export const fetchMessages = async (id) => {
  if (!auth.currentUser?.uid) {
    console.warn("error loading auth")
    setTimeout(() => {
      fetchMessages()
    }, 2000)
    return
  }
  const userDocRef = doc(collection(db, "users"), auth.currentUser.uid);
  const userDocSnapshot = await getDoc(userDocRef);

  if (userDocSnapshot.exists()) {
    const conversationsRef = doc(collection(db, "conversations"), id);
    const lRef = collection(conversationsRef, "messages");
    const conversationsQuery = query(
      lRef,
      // where("status", "==", "sent"),
      orderBy("created_at")
    );

    const draftSnapshot = await getDocs(conversationsQuery);
    const messages = [];

    for (const doc of draftSnapshot.docs) {
      const conversationsData = doc.data();
      if(conversationsData.status != "draft"){
        messages.push(conversationsData)
      }
    }
    return messages
  }
};

export const fetchRecipients = async (id) => {
  const conversationsRef = doc(collection(db, "conversations"), id);
  const conversations = await getDoc(query(conversationsRef))
  const users = conversations.data().members.filter(m => m.id !== auth.currentUser.uid)
  const members = [];
  for (const user of users) {
    try {
      const selectedUserDocRef = doc(db, "users", user.id);
      const selUser = await getDoc(selectedUserDocRef);
      members.push({...selUser.data(), id: selectedUserDocRef.id});
    } catch (e) {
      console.log("ERR: ", e)
    }
  }
  console.log("members to return", members)
  return members
}


export const fetchPendingReviewMessages = async (subcollectionRe, user) => {
  const messages = []
  const pendingQ = query(
    subcollectionRe,
    where("status", "==", 'pending_review'),
    where("deleted_at", '==', null),
    where("sent_by", "==", user),
    orderBy("created_at", "desc"),
  );
  const pendingSubcollectionSnapshott = await getDocs(pendingQ);
  if (!pendingSubcollectionSnapshott.empty) {
    pendingSubcollectionSnapshott.forEach((subDoc) => {
      const message = subDoc.data();
      messages.push({
        collectionId: subDoc.id,
        attachments: message.attachments,
        message: message.message,
        sent_by: message.sent_by,
        status: message.status,
        created_at: message.created_at,
        moderation: message.moderation_comments,
        pending: true
      });
    })
  }
  return messages
}