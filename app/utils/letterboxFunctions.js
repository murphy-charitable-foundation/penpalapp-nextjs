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
    where
} from "firebase/firestore"
import {auth, db} from "../firebaseConfig"
import * as Sentry from "@sentry/nextjs";

const DELAY = 1000


const getUserDoc = async () => {
    const userDocRef = doc(collection(db, "users"), auth.currentUser.uid);
    const userDocSnapshot = await getDoc(userDocRef);
    return {userDocRef, userDocSnapshot}
}

export const fetchLetterboxes = async () => {
    const retryFetch = () => setTimeout(() => fetchLetterboxes(), DELAY);

    if (!auth.currentUser?.uid) {
        retryFetch();
        return
    }
    const {userDocRef, userDocSnapshot} = await getUserDoc()
    if (!userDocSnapshot.exists()) return

    const letterboxQuery = query(collection(db, "letterbox"), where("members", "array-contains", userDocRef));
    const letterboxQuerySnapshot = await getDocs(letterboxQuery);
    return letterboxQuerySnapshot.docs
}

export const fetchLetterbox = async (id, lim = false, lastVisible = null) => {
    const retryFetch = () => setTimeout(() => fetchLetterbox(id, lim, lastVisible), DELAY);

    if (!auth.currentUser?.uid) {
        retryFetch();
        return
    }
    const {userDocSnapshot} = await getUserDoc()

    if (!userDocSnapshot.exists()) return;

    const letterboxRef = doc(collection(db, "letterbox"), id);
    const lRef = collection(letterboxRef, "letters");
    let letterboxQuery;

    // TODO temporarily disable moderation until it is developed
    if (lim) {
        letterboxQuery = lastVisible
            ? query(lRef, where("status", "==", "sent"), orderBy("timestamp", "desc"), startAfter(lastVisible), limit(lim))
            : query(lRef, where("status", "==", "sent"), orderBy("timestamp", "desc"), limit(lim));
    } else {
        letterboxQuery = lastVisible
            ? query(lRef, where("status", "==", "sent"), orderBy("timestamp", "desc"), startAfter(lastVisible))
            : query(lRef, where("status", "==", "sent"), orderBy("timestamp", "desc"));
    }


    /*if (lim) {
      letterboxQuery = lastVisible
        ? query(lRef, orderBy("timestamp", "desc"), startAfter(lastVisible), limit(lim))
        : query(lRef, orderBy("timestamp", "desc"), limit(lim));
    } else {
      letterboxQuery = lastVisible
        ? query(lRef, orderBy("timestamp", "desc"), startAfter(lastVisible))
        : query(lRef, orderBy("timestamp", "desc"));
    }*/

    try {
        const lettersSnapshot = await getDocs(letterboxQuery);
        const messages = lettersSnapshot.docs
            .map((doc) => doc.data())
            .filter((letterboxData) => !letterboxData.draft);

        const lastDoc = lettersSnapshot.docs[lettersSnapshot.docs.length - 1];
        return {
            messages: messages.length ? messages : [],
            lastVisible: lastDoc
        };
    } catch (e) {
        Sentry.captureException(e);
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
        return {...draftSnapshot.docs?.[0].data(), id: draftSnapshot.docs?.[0].id}
    }

    let draft;
    if (draftSnapshot.docs?.[0]?.data()) {
        draft = {...draftSnapshot.docs?.[0].data(), id: draftSnapshot.docs?.[0].id}
    } else if (createNew) {
        const d = await addDoc(lRef, {
            sent_by: userRef,
            content: "",
            status: "draft",
            timestamp: new Date(),
            deleted: null
        });
        draft = {sent_by: userRef, content: "", status: "draft", timestamp: new Date(), id: d.id, deleted: null}
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
            members.push({...selUser.data(), id: selectedUserDocRef.id});
        } catch (e) {
            Sentry.captureException(e);
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
        return true
    } catch (e) {
        Sentry.captureException(e);
        console.log("Failed to send letter: ", e)
        sendingLetter = false;
        return false
    }
}

/**
 * Counts the number of non-deleted letters with a specific status in a letterbox.
 *
 * Queries the "letters" subcollection of a given letterbox, filtering by status
 * and ensuring the letters are not deleted. Requires the user to be authenticated.
 *
 * @param {string} letterboxId - The ID of the letterbox to query.
 * @param {string} [status="sent"] - The status of the letters to count (defaults to "sent").
 * @returns {Promise<number>} The total count of matching letters in the letterbox.
 * @throws {Error} Logs an error to the console if the query fails, returning 0 in such cases.
 */
export const fetchLetterCountForLetterbox = async (letterboxId, status = "sent") => {
    if (!auth.currentUser) {
        console.log("User not authenticated");
        return 0;
    }
    try {
        const letterboxRef = doc(collection(db, "letterbox"), letterboxId);
        const lRef = collection(letterboxRef, "letters");
        const letterQuery = query(
            lRef,
            where("status", "==", status),
            where("deleted", "==", null)
        );
        const letterSnapshot = await getDocs(letterQuery);
        console.log(`Letters for ${letterboxId}:`, letterSnapshot.docs.map(d => d.data()));
        const count = letterSnapshot.docs.length;
        console.log(`Letter count for letterbox ${letterboxId} with status "${status}": ${count}`);
        return count;
    } catch (error) {
        console.error("Error fetching letter count for letterbox:", error.message);
        return 0;
    }
};
