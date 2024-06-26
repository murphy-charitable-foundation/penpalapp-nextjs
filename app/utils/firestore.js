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
  const userDocSnapshot = await getDoc(userDocRef);

  if (userDocSnapshot.exists()) {
    const letterboxQuery = query(collection(db, "letterbox"), where("members", "array-contains", userDocRef));
    const letterboxQuerySnapshot = await getDocs(letterboxQuery);

    const messages = [];

    for (const doc of letterboxQuerySnapshot.docs) {
      const letterboxData = doc.data();
      const lettersCollectionRef = collection(doc.ref, "letters");

      const sentLettersQuerySnapshot = await getDocs(
        query(lettersCollectionRef,
          where("status", "==", 'sent'),
          where("deleted_at", "==", null),
          orderBy("created_at", "desc"),
          limit(10)
        )
      );
      console.log("sent letter", sentLettersQuerySnapshot)

      if (!sentLettersQuerySnapshot.empty) {
        const queryDocumentSnapshots = sentLettersQuerySnapshot.docs
        const latestMessage = queryDocumentSnapshots[0].data()
        messages.push({
          letterboxId: doc.id,
          collectionId: queryDocumentSnapshots[0].id,
          receiver: letterboxData.members.find(memberRef => memberRef.id !== auth.currentUser.uid).id,
          content: latestMessage.letter,
          deleted: latestMessage.deleted_at,
          created_at: latestMessage.created_at,
        });
      }

      const pendingLettersQuerySnapshot = await getDocs(
        query(lettersCollectionRef,
          where("status", "==", 'pending_review'),
          where("deleted_at", "==", null),
          where("sent_by", "==", userDocRef),
          orderBy("created_at", "desc"),
          limit(10)
        )
      );

      if (!pendingLettersQuerySnapshot.empty) {
        const queryDocumentSnapshots = pendingLettersQuerySnapshot.docs
        const latestMessage = queryDocumentSnapshots[0].data()
        messages.push({
          letterboxId: doc.id,
          collectionId: queryDocumentSnapshots[0].id,
          receiver: letterboxData.members.find(memberRef => memberRef.id !== auth.currentUser.uid).id,
          letter: latestMessage.letter,
          deleted: latestMessage.deleted_at,
          created_at: latestMessage.created_at,
          pending: true
        });
      }
    }
    function findLatestMessages(messages) {
      const latestMessagesMap = new Map();
      for (const message of messages) {
        if (latestMessagesMap.has(message.letterboxId)) {
          const currentLatestMessage = latestMessagesMap.get(message.letterboxId);
          if (message.created_at.seconds > currentLatestMessage.created_at.seconds) {
            latestMessagesMap.set(message.letterboxId, message);
          }
        } else {
          latestMessagesMap.set(message.letterboxId, message);
        }
      }
      return Array.from(latestMessagesMap, ([_name, value]) => value)
    }
    return findLatestMessages(messages)
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
  console.log("lbox", letterbox)
  const users = letterbox.data().members.filter(m => m.id !== auth.currentUser.uid)
  console.log("users", users)
  const members = [];
  for (const user of users) {
    try {
      const selectedUserDocRef = doc(db, "users", user.id);
      const selUser = await getDoc(selectedUserDocRef);
      console.log("user", selUser.data());
      members.push(selUser.data());
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
    orderBy("created_at", "desc"),
    where("sent_by", "==", user),
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