import { collection, doc, getDoc, getDocs, limit, orderBy, query, where } from "firebase/firestore"
import { auth, db } from "../firebaseConfig"

const getUserDoc = async () => {
  const userDocRef = doc(collection(db, "users"), auth.currentUser.uid);
  const userDocSnapshot = await getDoc(userDocRef);
  return userDocSnapshot
}

export const fetchLetterboxes = async () => {
  const retryFetch = () => setTimeout(() => fetchLetterboxes(id), 2000);

  if (!auth.currentUser?.uid) {
    retryFetch();
    return
  }
  const userDocSnapshot = await getUserDoc()

  if (userDocSnapshot.exists()) {
    const letterboxQuery = query(collection(db, "letterbox"), where("members", "array-contains", userDocRef));
    const letterboxQuerySnapshot = await getDocs(letterboxQuery);
    return letterboxQuerySnapshot
  }
}

export const fetchLetterbox = async (id) => {
  const retryFetch = () => setTimeout(() => fetchLetterbox(id), 2000);

  if (!auth.currentUser?.uid) {
    retryFetch();
    return
  }
  const userDocSnapshot = await getUserDoc()

  if (!userDocSnapshot.exists()) return;

  const letterboxRef = doc(collection(db, "letterbox"), id);
  const lRef = collection(letterboxRef, "letters");
  const letterboxQuery = query(lRef, where("draft", "==", false), orderBy("timestamp"));

  const lettersSnapshot = await getDocs(letterboxQuery);

  const messages = lettersSnapshot.docs
    .map((doc) => doc.data())
    .filter((letterboxData) => !letterboxData.draft);
  return messages
}

export const fetchDraft = async (id, userRef) => {
  const letterboxRef = doc(collection(db, "letterbox"), id);
  const lRef = collection(letterboxRef, "letters");
  const letterboxQuery = query(
    lRef,
    where("sent_by", "==", userRef),
    where("draft", "==", true),
    limit(1)
  );
  const draftSnapshot = await getDocs(letterboxQuery);
  if (draftSnapshot.docs?.[0]?.data()) {
    return { ...draftSnapshot.docs?.[0].data(), id: draftSnapshot.docs?.[0].id }
  }

  let draft
  if (draftSnapshot.docs?.[0]?.data()) {
    draft = { ...draftSnapshot.docs?.[0].data(), id: draftSnapshot.docs?.[0].id }
  } else {
    const d = await addDoc(lRef, { sent_by: userRef, content: "", draft: true, deleted: null });
    draft = { sent_by: userRef, content: "", draft: true, id: d.id, deleted: null }
  }
  return draft
}
