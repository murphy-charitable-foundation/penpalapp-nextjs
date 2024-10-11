import { addDoc, collection, doc, getDoc, getDocs, limit, orderBy, query, startAfter, updateDoc, where } from "firebase/firestore"
import { auth, db } from "../firebaseConfig"

const DELAY = 1000


const getUserDoc = async () => {
  const userDocRef = doc(collection(db, "users"), auth.currentUser.uid);
  const userDocSnapshot = await getDoc(userDocRef);
  return { userDocRef, userDocSnapshot }
}

export const fetchLetterboxes = async () => {
  const retryFetch = () => setTimeout(() => fetchLetterboxes(), DELAY);

  if (!auth.currentUser?.uid) {
    retryFetch();
    return
  }
  const { userDocRef, userDocSnapshot } = await getUserDoc()
  if (!userDocSnapshot.exists()) return

  const letterboxQuery = query(collection(db, "letterbox"), where("members", "array-contains", userDocRef));
  const letterboxQuerySnapshot = await getDocs(letterboxQuery);
  const letterboxes = letterboxQuerySnapshot.docs
  return letterboxes
}

export const fetchLetterbox = async (id, lim = false, lastVisible = null) => {
  const retryFetch = () => setTimeout(() => fetchLetterbox(id, lim, lastVisible), DELAY);

  if (!auth.currentUser?.uid) {
    retryFetch();
    return
  }
  const { userDocSnapshot } = await getUserDoc()

  if (!userDocSnapshot.exists()) return;

  const letterboxRef = doc(collection(db, "letterbox"), id);
  const lRef = collection(letterboxRef, "letters");
  let letterboxQuery;
  if (lim) {
    letterboxQuery = lastVisible
      ? query(lRef, where("status", "==", "sent"), orderBy("timestamp", "desc"), startAfter(lastVisible), limit(lim))
      : query(lRef, where("status", "==", "sent"), orderBy("timestamp", "desc"), limit(lim));
  } else {
    letterboxQuery = lastVisible
      ? query(lRef, where("status", "==", "sent"), orderBy("timestamp", "desc"), startAfter(lastVisible))
    
      : query(lRef, where("status", "==", "sent"), orderBy("timestamp", "desc"));
  }

  try {
    console.log(
      'before'
    )
    const lettersSnapshot = await getDocs(letterboxQuery);
    console.log('after', lettersSnapshot)
    const messages = lettersSnapshot.docs
      .map((doc) => doc.data())
      .filter((letterboxData) => !letterboxData.draft);

    const lastDoc = lettersSnapshot.docs[lettersSnapshot.docs.length - 1];
    console.log("messages", messages);
    return {
      messages: messages.length ? messages : [],
      lastVisible: lastDoc
    };
  } catch (e) {
    console.log("Error fetching letterbox: ", e)
    return {
      messages: [],
      lastVisible: null
    }
  }
}

export const fetchDraft = async (id, userRef, createNew = false) => {
  const letterboxRef = doc(collection(db, "letterbox"), id);
  const lRef = collection(letterboxRef, "letters");
  const letterboxQuery = query(
    lRef,
    where("sent_by", "==", userRef),
    where("status", "==", "draft"),
    limit(1)
  );
  const draftSnapshot = await getDocs(letterboxQuery);
  if (draftSnapshot.docs?.[0]?.data()) {
    return { ...draftSnapshot.docs?.[0].data(), id: draftSnapshot.docs?.[0].id }
  }

  let draft;
  if (draftSnapshot.docs?.[0]?.data()) {
    draft = { ...draftSnapshot.docs?.[0].data(), id: draftSnapshot.docs?.[0].id }
  } else if (createNew) {
    const d = await addDoc(lRef, { sent_by: userRef, content: "", status: "draft", deleted: null });
    draft = { sent_by: userRef, content: "", status: "draft", id: d.id, deleted: null }
  }
  return draft
}

export const fetchRecipients = async (id) => {
  const letterboxRef = doc(collection(db, "letterbox"), id);
  const letterbox = await getDoc(letterboxRef);

  const retryFetch = () => setTimeout(() => fetchRecipients(id), DELAY);
  if (!auth.currentUser?.uid) {
    retryFetch();
    return
  }

  const currentUserUid = auth.currentUser.uid;

  const users = letterbox.data().members.filter((m) => m.id !== currentUserUid);
  const members = [];

  for (const user of users) {
    try {
      const selectedUserDocRef = doc(db, "users", user.id);
      const selUser = await getDoc(selectedUserDocRef);
      members.push({ ...selUser.data(), id: selectedUserDocRef.id });
    } catch (e) {
      console.error("Error fetching user:", e);
    }
  }
  return members;
};

let sendingLetter = false;
export const sendLetter = async (letterData, letterRef, draftId) => {
  if (sendingLetter) return;
  try {
    sendingLetter = true;
    await updateDoc(doc(letterRef, draftId), letterData)
    sendingLetter = false;
    return true
  } catch (e) {
    console.log("Failed to send letter: ", e)
    sendingLetter = false;
    return false
  }
}
