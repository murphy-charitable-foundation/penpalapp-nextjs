import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  updateDoc,
  where,
  setDoc,
} from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import * as Sentry from "@sentry/nextjs";

const DELAY = 1000;

const getUserDoc = async () => {
  const userDocRef = doc(collection(db, "users"), auth.currentUser.uid);
  const userDocSnapshot = await getDoc(userDocRef);
  return { userDocRef, userDocSnapshot };
};

export const fetchLetterboxes = async () => {
  const retryFetch = () => setTimeout(() => fetchLetterboxes(), DELAY);

  if (!auth.currentUser?.uid) {
    retryFetch();
    return;
  }
  const { userDocRef, userDocSnapshot } = await getUserDoc();
  if (!userDocSnapshot.exists()) return;

  const letterboxQuery = query(
    collection(db, "letterbox"),
    where("members", "array-contains", userDocRef)
  );
  const letterboxQuerySnapshot = await getDocs(letterboxQuery);
  const letterboxes = letterboxQuerySnapshot.docs;
  return letterboxes;
};

export const fetchLetterbox = async (id, lim = false, lastVisible = null) => {
  if (!auth.currentUser?.uid) {
    return { messages: [], lastVisible: null };
  }

  try {
    const { userDocSnapshot } = await getUserDoc();
    if (!userDocSnapshot.exists()) return { messages: [], lastVisible: null };

    // Ensure this letterbox is accessible to the current user
    const letterboxRef = doc(db, "letterbox", id);
    const letterboxDoc = await getDoc(letterboxRef);

    if (!letterboxDoc.exists()) {
      console.error("Letterbox does not exist");
      return { messages: [], lastVisible: null };
    }

    // Verify current user is a member of this letterbox
    const members = letterboxDoc.data().members || [];
    const userRef = doc(db, "users", auth.currentUser.uid);
    const isMember = members.some(
      (member) => member.id === auth.currentUser.uid
    );

    if (!isMember) {
      console.error("User is not a member of this letterbox");
      return { messages: [], lastVisible: null };
    }

    // Now query the letters subcollection
    const lRef = collection(letterboxRef, "letters");

    const baseConditions = [
      where("status", "==", "sent"), // Only get sent messages
      orderBy("created_at", "desc"),
    ];

    if (lastVisible) baseConditions.push(startAfter(lastVisible));
    if (lim) baseConditions.push(limit(lim));

    const letterboxQuery = query(lRef, ...baseConditions);
    const lettersSnapshot = await getDocs(letterboxQuery);

    const messages = lettersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      created_at: doc.data().created_at?.toDate?.() || doc.data().created_at,
    }));

    return {
      messages: messages,
      lastVisible: lettersSnapshot.docs[lettersSnapshot.docs.length - 1],
    };
  } catch (e) {
    console.error("Error fetching letterbox:", {
      error: e,
      id,
      lim,
      lastVisible: lastVisible?.id,
    });
    Sentry.captureException(e);
    return { messages: [], lastVisible: null };
  }
};

export const fetchDraft = async (id, userRef, createNew = false) => {
  const letterboxRef = doc(collection(db, "letterbox"), id);
  const lRef = collection(letterboxRef, "letters");
  const letterboxQuery = query(
    lRef,
    where("sent_by", "==", userRef),
    where("status", "==", "draft"),
    where("content", "!=", ""),
    limit(1)
  );
  const draftSnapshot = await getDocs(letterboxQuery);

  if (draftSnapshot.docs?.[0]) {
    return {
      ...draftSnapshot.docs[0].data(),
      id: draftSnapshot.docs[0].id,
    };
  }

  // Only create new draft if explicitly requested
  if (createNew) {
    const draftData = {
      sent_by: userRef,
      content: "",
      status: "draft",
      created_at: new Date(),
      deleted: null,
    };
    const d = await addDoc(lRef, draftData);
    return {
      ...draftData,
      id: d.id,
    };
  }

  return null;
};

export const fetchLatestLetterFromLetterbox = async (letterboxId, userRef) => {
  const draft = await fetchDraft(letterboxId, userRef, false);
  if (draft) return draft;

  const lettersRef = collection(db, "letterbox", letterboxId, "letters");
  const q = query(lettersRef, where("status", "==", "sent"), orderBy("created_at", "desc"), limit(1));
  const letterSnapshot = await getDocs(q);
  let letter;
  letterSnapshot.forEach((doc) => {
    letter = { id: doc.id, ...doc.data() };
  });
  return letter;
};

export const fetchRecipients = async (id) => {
  const letterboxRef = doc(collection(db, "letterbox"), id);
  const letterbox = await getDoc(letterboxRef);

  const retryFetch = () => setTimeout(() => fetchRecipients(id), DELAY);
  if (!auth.currentUser?.uid) {
    retryFetch();
    return;
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
      Sentry.captureException(e);
      console.error("Error fetching user:", e);
    }
  }
  return members;
};

let sendingLetter = false;
export const sendLetter = async (letterData, lettersRef, draftId = null) => {
  if (sendingLetter) {
    console.warn("Letter sending already in progress");
    return null;
  }

  try {
    sendingLetter = true;
    let letterRef;

    // Make sure sent_by is always a reference
    if (typeof letterData.sent_by === "string") {
      letterData.sent_by = doc(db, "users", letterData.sent_by);
    }

    // Make sure created_at is a proper timestamp
    if (!(letterData.created_at instanceof Date)) {
      letterData.created_at = new Date();
    }

    // Ensure status is "sent" when actually sending
    letterData.status = "sent";

    console.log("Sending letter with data:", letterData);

    if (draftId) {
      // Update existing draft to sent status
      letterRef = doc(lettersRef, draftId);
      console.log("Updating draft:", draftId, "to sent status");

      // Use updateDoc with only the fields that need to change
      await updateDoc(letterRef, {
        content: letterData.content,
        status: "sent",
        // Don't update created_at or sent_by for existing drafts
      });

      console.log("Successfully updated draft to sent");
      return { id: draftId, ...letterData };
    } else {
      // Create new letter with sent status
      console.log("Creating new letter with sent status");
      letterRef = await addDoc(lettersRef, letterData);
      console.log("Successfully created new letter:", letterRef.id);
      return { id: letterRef.id, ...letterData };
    }
  } catch (error) {
    console.error("Error sending letter:", {
      error: error.message,
      code: error.code,
      letterData,
      draftId,
    });
    Sentry.captureException(error);
    throw error;
  } finally {
    sendingLetter = false;
  }
};
