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
  const retryFetch = () =>
    setTimeout(() => fetchLetterbox(id, lim, lastVisible), DELAY);

  if (!auth.currentUser?.uid) {
    retryFetch();
    return;
  }
  const { userDocSnapshot } = await getUserDoc();

  if (!userDocSnapshot.exists()) return;

  const letterboxRef = doc(collection(db, "letterbox"), id);
  const lRef = collection(letterboxRef, "letters");
  let letterboxQuery;

  // TODO temporarily disable moderation until it is developed
  if (lim) {
    letterboxQuery = lastVisible
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
    letterboxQuery = lastVisible
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
    letterboxQuery = lastVisible
      ? query(lRef, orderBy("created_at", "desc"), startAfter(lastVisible), limit(lim))
      : query(lRef, orderBy("created_at", "desc"), limit(lim));
  } else {
    letterboxQuery = lastVisible
      ? query(lRef, orderBy("created_at", "desc"), startAfter(lastVisible))
      : query(lRef, orderBy("created_at", "desc"));
  }*/

  try {
    const lettersSnapshot = await getDocs(letterboxQuery);
    const messages = lettersSnapshot.docs
      .map((doc) => {
        return { id: doc.id, ...doc.data() };
      })
      .filter((letterboxData) => letterboxData.status != "draft");

    const lastDoc = lettersSnapshot.docs[lettersSnapshot.docs.length - 1];
    return {
      messages: messages.length ? messages : [],
      lastVisible: lastDoc,
    };
  } catch (e) {
    logError(e, {
      description: "Error fetching letterbox: ",
    });
    return {
      messages: [],
      lastVisible: null,
    };
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

export const fetchLatestLetterFromLetterboxOld = async (
  letterboxId,
  userRef
) => {
  const draft = await fetchDraft(letterboxId, userRef, false);
  if (draft) return draft;

  const lettersRef = collection(db, "letterbox", letterboxId, "letters");
  const q = query(
    lettersRef,
    where("status", "==", "sent"),
    orderBy("created_at", "desc"),
    limit(1)
  );
  const letterSnapshot = await getDocs(q);
  let letter;
  letterSnapshot.forEach((doc) => {
    letter = { id: doc.id, ...doc.data() };
  });
  return letter;
};

export const fetchLatestLetterFromLetterbox = async (letterboxId, userRef) => {
  const letterboxRef = doc(collection(db, "letterbox"), letterboxId);
  const lRef = collection(letterboxRef, "letters");

  // My Letters
  const userLettersQuery = query(
    lRef,
    where("sent_by", "==", userRef),
    where("content", "!=", ""),
    orderBy("updated_at", "desc"),
    limit(1) // grab a few in case of fallback
  );

  // Your letters
  const sentLettersQuery = query(
    lRef,
    where("status", "==", "sent"),
    where("content", "!=", ""),
    orderBy("updated_at", "desc"),
    limit(1)
  );

  // Run both in parallel
  const [userLettersSnap, sentLettersSnap] = await Promise.all([
    getDocs(userLettersQuery),
    getDocs(sentLettersQuery),
  ]);

  const allLetters = [];

  if (!userLettersSnap?.empty)
    userLettersSnap.forEach((doc) => {
      allLetters.push({ id: doc?.id, ...doc?.data() });
    });

  if (!sentLettersSnap?.empty)
    sentLettersSnap.forEach((doc) => {
      if (doc?.data()?.sent_by?.id !== userRef?.id)
        allLetters.push({ id: doc?.id, ...doc?.data() });
    });

  if (allLetters.length === 0) return null;
  else if (allLetters.length === 1) return allLetters[0];
  else if (
    allLetters[0]?.updated_at?.toDate?.() >
    allLetters[1]?.updated_at?.toDate?.()
  )
    return allLetters[0];
  else return allLetters[1];
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

let sendingLetter = false;
export const sendLetter = async (letterData, letterRef, draftId) => {
  if (sendingLetter) return;
  try {
    sendingLetter = true;
    await updateDoc(doc(letterRef, draftId), letterData);
    sendingLetter = false;
    return true;
  } catch (e) {
    logError(e, {
      description: "Failed to send letter: ",
    });
    sendingLetter = false;
    return false;
  }
};

export const createConnection = async (userDocRef, kid) => {
    try {
      console.log("Kid:", kid);
      console.log("User:", userDocRef);

      if (kid != null && userDocRef != null) {
        if (kid.connected_penpals_count < 3) {
          // Define references for user and kid
          const kidDocRef = doc(db, "users", kid.id);

          // query DB to check for existing letterbox
          let letterboxQuery = query(
            collection(db, "letterbox"),
            where("members", "==", [userDocRef, kidDocRef]) // Use reference, not string
          );

          let querySnapshot = await getDocs(letterboxQuery);
          
          if (querySnapshot.empty) {
            letterboxQuery = query(
              collection(db, "letterbox"),
              where("members", "==", [kidDocRef, userDocRef])
            );
            querySnapshot = await getDocs(letterboxQuery);
          }

          let letterboxRef;

          if (querySnapshot.empty) { // if there's no letterbox, create one.
            letterboxRef = await addDoc(collection(db, "letterbox"), {
              members: [
                userDocRef, 
                kidDocRef   
              ],
              created_at: new Date(),
              archived_at: null,
            });

            await addDoc(collection(letterboxRef, "letters"), {
              sent_by: userDocRef,
              content: "Please complete your first letter here...",
              status: "draft",
              updated_at: new Date(),
              deleted: null
            });

            // Update User and Kid documents
            await updateDoc(userDocRef, {
              connected_penpals: arrayUnion(kidDocRef),
            });

            await updateDoc(kidDocRef, {
              connected_penpals: arrayUnion(userDocRef),
              connected_penpals_count: increment(1),
            });

            return letterboxRef;
          } else {
            // Penpal and kid are already connected, do nothing
            return;
          }
        } else {
          throw new Error("Kid has exceeded penpal limit");
        }
      } else {
        throw new Error("No kid or user data");
      }
    } catch (error) {
      logError("There has been a error creating the connection: " + error.message, { error });
      throw error; // rethrow so callers can handle it
    }
  };
