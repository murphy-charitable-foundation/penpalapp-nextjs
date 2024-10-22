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
    const letterboxQuery = query(collection(db, "letterbox"), where("members", "array-contains", userDocRef));
    const letterboxQuerySnapshot = await getDocs(letterboxQuery);

    const messages = [];

    for (const document of letterboxQuerySnapshot.docs) {
      const letterboxData = document.data();
      const letterboxRef = doc(collection(db, "letterbox"), document.id);
      const lRef = collection(letterboxRef, "letters");
      const draftQuery = query(
        lRef,
        where("status", "==", "draft"),
        where('sent_by', "==", userDocRef),
        orderBy("timestamp"),
        limit(1)
      )
      const draftSnapshot = await getDocs(draftQuery);
      console.log("DRAFT", draftSnapshot)
      if (!draftSnapshot.empty) {
        const queryDocumentSnapshots = draftSnapshot.docs;
        const latestMessage = queryDocumentSnapshots[0].data();
        messages.push({
          letterboxId: document.id,
          collectionId: queryDocumentSnapshots[0].id,
          receiver: letterboxData.members.find(memberRef => memberRef.id !== auth.currentUser.uid).id,
          content: latestMessage.content,
          status: latestMessage.status,
          deleted: latestMessage.deleted_at,
          created_at: latestMessage.created_at,
        });
      } else {
        const letterboxQuery = query(
          lRef,
          where("content", "!=", ''), // Exclude empty messages
          where("deleted", "==", false),
          where("status", "==", "approved"),
          orderBy("timestamp")
        );
  
        const snapshot = await getDocs(letterboxQuery);
  
        if (!snapshot.empty) {
          const queryDocumentSnapshots = snapshot.docs;
          const latestMessage = queryDocumentSnapshots[0].data();
          messages.push({
            letterboxId: document.id,
            collectionId: queryDocumentSnapshots[0].id,
            receiver: letterboxData.members.find(memberRef => memberRef.id !== auth.currentUser.uid).id,
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


export const fetchLetters = async (id) => {
  if (!auth.currentUser?.uid) {
    console.warn("error loading auth")
    setTimeout(() => {
      fetchLetters()
    }, 2000)
    return
  }
  const userDocRef = doc(collection(db, "users"), auth.currentUser.uid);
  const userDocSnapshot = await getDoc(userDocRef);

  if (userDocSnapshot.exists()) {
    const letterboxRef = doc(collection(db, "letterbox"), id);
    const lRef = collection(letterboxRef, "letters");
    const letterboxQuery = query(
      lRef,
      // where("status", "==", "sent"),
      orderBy("timestamp")
    );

    const draftSnapshot = await getDocs(letterboxQuery);
    const messages = [];

    for (const doc of draftSnapshot.docs) {
      const letterboxData = doc.data();
      if(!letterboxData.draft){
        messages.push(letterboxData)
      }
    }
    return messages
  }
};

export const fetchRecipients = async (id) => {
  const letterboxRef = doc(collection(db, "letterbox"), id);
  const letterbox = await getDoc(query(letterboxRef))
  const users = letterbox.data().members.filter(m => m.id !== auth.currentUser.uid)
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
      const letter = subDoc.data();
      messages.push({
        collectionId: subDoc.id,
        attachments: letter.attachments,
        letter: letter.letter,
        sent_by: letter.sent_by,
        status: letter.status,
        created_at: letter.created_at,
        moderation: letter.moderation_comments,
        pending: true
      });
    })
  }
  return messages
}