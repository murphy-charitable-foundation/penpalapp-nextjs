import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "../firebaseConfig";

const DELAY = 1000;
const DELAY = 1000;

const getUserDoc = async () => {
  const userDocRef = doc(collection(db, "users"), auth.currentUser.uid);
  const userDocSnapshot = await getDoc(userDocRef);
  return { userDocRef, userDocSnapshot };
};
  return { userDocRef, userDocSnapshot };
};

export const fetchLetterboxes = async () => {
  const retryFetch = () => setTimeout(() => fetchLetterboxes(), DELAY);

  if (!auth.currentUser?.uid) {
    retryFetch();
    return;
    return;
  }
  const { userDocRef, userDocSnapshot } = await getUserDoc();
  if (!userDocSnapshot.exists()) return;
  const { userDocRef, userDocSnapshot } = await getUserDoc();
  if (!userDocSnapshot.exists()) return;

  const letterboxQuery = query(
    collection(db, "letterbox"),
    where("members", "array-contains", userDocRef)
  );
  const letterboxQuery = query(
    collection(db, "letterbox"),
    where("members", "array-contains", userDocRef)
  );
  const letterboxQuerySnapshot = await getDocs(letterboxQuery);
  const letterboxes = letterboxQuerySnapshot.docs;
  return letterboxes;
};
  const letterboxes = letterboxQuerySnapshot.docs;
  return letterboxes;
};

export const fetchLetterbox = async (id, lim = false) => {
  const retryFetch = () => setTimeout(() => fetchLetterbox(id), DELAY);

  if (!auth.currentUser?.uid) {
    retryFetch();
    return;
    return;
  }

  const { userDocSnapshot } = await getUserDoc();

  if (!userDocSnapshot.exists()) return;

  const letterboxRef = doc(collection(db, "letterbox"), id);
  const lRef = collection(letterboxRef, "letters");
  const letterboxQuery = lim
    ? query(
        lRef,
        where("status", "==", "approved"),
        orderBy("timestamp"),
        limit(lim)
      )
    : query(lRef, where("status", "==", "approved"), orderBy("timestamp"));

  try {
    const lettersSnapshot = await getDocs(letterboxQuery);

    // Fetch the messages from the letterbox
    const letters = lettersSnapshot.docs
      .map((doc) => doc.data())
      .filter((letterboxData) => !letterboxData.draft);

    // Retrieve user details for each letter by resolving the `sent_by` reference
    const userFetchPromises = letters.map(async (letter) => {
      if (letter.sent_by) {
        const userSnapshot = await getDoc(letter.sent_by); // Dereference the `sent_by` field
        if (userSnapshot.exists()) {
          const { first_name, last_name, photo_uri, country } =
            userSnapshot.data();
          return {
            ...letter,
            user: { first_name, last_name, photo_uri, country },
          };
        }
      }
      return { ...letter, user: null };
    });

    const messagesWithUsers = await Promise.all(userFetchPromises);

    return messagesWithUsers.length ? messagesWithUsers : [];
  } catch (e) {
    console.log("Error fetching letterbox: ", e);
    return [];
  }
};

export const fetchDraft = async (id, userRef, createNew = false) => {
  const letterboxRef = doc(collection(db, "letterbox"), id);
  const lRef = collection(letterboxRef, "letters");
  const letterboxQuery = query(
    lRef,
    where("sent_by", "==", userRef),
    where("status", "==", "draft"),
    where("status", "==", "draft"),
    limit(1)
  );
  const draftSnapshot = await getDocs(letterboxQuery);
  if (draftSnapshot.docs?.[0]?.data()) {
    return {
      ...draftSnapshot.docs?.[0].data(),
      id: draftSnapshot.docs?.[0].id,
    };
    return {
      ...draftSnapshot.docs?.[0].data(),
      id: draftSnapshot.docs?.[0].id,
    };
  }

  let draft;
  let draft;
  if (draftSnapshot.docs?.[0]?.data()) {
    draft = {
      ...draftSnapshot.docs?.[0].data(),
      id: draftSnapshot.docs?.[0].id,
    };
    draft = {
      ...draftSnapshot.docs?.[0].data(),
      id: draftSnapshot.docs?.[0].id,
    };
  } else if (createNew) {
    const d = await addDoc(lRef, {
      sent_by: userRef,
      content: "",
      draft: true,
      deleted: null,
    });
    draft = {
      sent_by: userRef,
      content: "",
      draft: true,
      id: d.id,
      deleted: null,
    };
    const d = await addDoc(lRef, {
      sent_by: userRef,
      content: "",
      draft: true,
      deleted: null,
    });
    draft = {
      sent_by: userRef,
      content: "",
      draft: true,
      id: d.id,
      deleted: null,
    };
  }
  return draft;
};
  return draft;
};

export const fetchRecipients = async (id) => {
  const letterboxRef = doc(collection(db, "letterbox"), id);
  const letterbox = await getDoc(letterboxRef);

  const retryFetch = () => setTimeout(() => fetchRecipients(id), DELAY);
  if (!auth.currentUser?.uid) {
    retryFetch();
    return;
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
    await updateDoc(doc(letterRef, draftId), letterData);
    sendingLetter = false;
    return true;
    sendingLetter = true;
    await updateDoc(doc(letterRef, draftId), letterData);
    sendingLetter = false;
    return true;
  } catch (e) {
    console.log("Failed to send letter: ", e);
    sendingLetter = false;
    return false;
    console.log("Failed to send letter: ", e);
    sendingLetter = false;
    return false;
  }
};
};
