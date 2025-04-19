import { db } from "../firebaseConfig";
import { collection, query, where, getDocs, DocumentReference } from "firebase/firestore";

export async function fetchLetterboxes() {
  const letterboxesRef = collection(db, "letterboxes");
  const querySnapshot = await getDocs(letterboxesRef);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function fetchDraft(letterboxId: string, userRef: DocumentReference, isDraft: boolean) {
  const draftsRef = collection(db, "drafts");
  const q = query(
    draftsRef,
    where("letterboxId", "==", letterboxId),
    where("userRef", "==", userRef),
    where("isDraft", "==", isDraft)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs[0]?.data();
}

export async function fetchLetterbox(letterboxId: string, limit: number) {
  const lettersRef = collection(db, `letterboxes/${letterboxId}/letters`);
  const querySnapshot = await getDocs(lettersRef);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).slice(0, limit);
}

export async function fetchRecipients(letterboxId: string) {
  const recipientsRef = collection(db, `letterboxes/${letterboxId}/recipients`);
  const querySnapshot = await getDocs(recipientsRef);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}