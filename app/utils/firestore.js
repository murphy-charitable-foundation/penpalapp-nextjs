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

    for (const document of letterboxQuerySnapshot.docs) {
      console.log(document)
      const letterboxData = document.data();
      const lettersCollectionRef = collection(document.ref, "letters");

      const letterboxRef = doc(collection(db, "letterbox"), document.id);
      const lRef = collection(letterboxRef, "letters");
      const letterboxQuery = query(
        lRef,
        where("content", "!=", ''), // Exclude empty messages
        where("deleted", "==", null),
        orderBy("timestamp")
      );

      const draftSnapshot = await getDocs(letterboxQuery);

      if (!draftSnapshot.empty) {
        const queryDocumentSnapshots = draftSnapshot.docs;
        const latestMessage = queryDocumentSnapshots[0].data();
        messages.push({
          letterboxId: document.id,
          collectionId: queryDocumentSnapshots[0].id,
          receiver: letterboxData.members.find(memberRef => memberRef.id !== auth.currentUser.uid).id,
          content: latestMessage.content,
          draft: latestMessage.draft,
          deleted: latestMessage.deleted_at,
          created_at: latestMessage.created_at,
        });
      }

      const recentMessageQuery = query(
        lettersCollectionRef,
        where("content", "!=", null), // Exclude empty messages
        where("deleted", "==", null),
        where("draft", "in", [false, true]),
        orderBy("created_at", "desc"),
        limit(1)
      );

      const recentMessageSnapshot = await getDocs(recentMessageQuery);

      if (!recentMessageSnapshot.empty) {
        const queryDocumentSnapshots = recentMessageSnapshot.docs;
        const latestMessage = queryDocumentSnapshots[0].data();
        messages.push({
          letterboxId: document.id,
          collectionId: queryDocumentSnapshots[0].id,
          receiver: letterboxData.members.find(memberRef => memberRef.id !== auth.currentUser.uid).id,
          content: latestMessage.content,
          draft: latestMessage.draft,
          deleted: latestMessage.deleted_at,
          created_at: latestMessage.created_at,
        });
      }

      // Get the most recent pending message separately (if any)
      // const pendingLettersQuerySnapshot = await getDocs(
      //   query(lettersCollectionRef,
      //     where("status", "==", 'pending_review'),
      //     where("deleted", "==", null),
      //     where("sent_by", "==", userDocRef),
      //     orderBy("created_at", "desc"),
      //     limit(1)
      //   )
      // );

      // if (!pendingLettersQuerySnapshot.empty) {
      //   const queryDocumentSnapshots = pendingLettersQuerySnapshot.docs
      //   const latestMessage = queryDocumentSnapshots[0].data()
      //   // Add pending message with priority if it's more recent
      //   if (latestMessage.created_at > messages[0]?.created_at) {
      //     messages.unshift({
      //       letterboxId: document.id,
      //       collectionId: queryDocumentSnapshots[0].id,
      //       receiver: letterboxData.members.find(memberRef => memberRef.id !== auth.currentUser.uid).id,
      //       content: latestMessage.content,
      //       deleted: latestMessage.deleted_at,
      //       created_at: latestMessage.created_at,
      //       pending: true
      //     });
      //   }
      // }
    }
    console.log("MESSAGES", messages)
    return messages
  }
};

// export const fetchData = async () => {
//   if (!auth.currentUser?.uid) {
//     console.warn("error loading auth")
//     setTimeout(() => {
//       fetchData()
//     }, 2000)
//     return
//   }
//   const userDocRef = doc(collection(db, "users"), auth.currentUser.uid);
//   const userDocSnapshot = await getDoc(userDocRef);

//   if (userDocSnapshot.exists()) {
//     const letterboxQuery = query(collection(db, "letterbox"), where("members", "array-contains", userDocRef));
//     const letterboxQuerySnapshot = await getDocs(letterboxQuery);

//     const messages = [];

//     for (const doc of letterboxQuerySnapshot.docs) {
//       const letterboxData = doc.data();
//       const lettersCollectionRef = collection(doc.ref, "letters");

//       const sentLettersQuerySnapshot = await getDocs(
//         query(lettersCollectionRef,
//           // where("status", "==", 'sent'),
//           where("content", "!=", null),
//           where("deleted", "==", null),
//           where("draft", "==", false),
//           orderBy("created_at", "desc"),
//           limit(1)
//         )
//       );

//       console.log("sent", sentLettersQuerySnapshot)

//       const draftsSnapshot = await getDocs(
//         query(lettersCollectionRef,
//           // where("status", "==", 'sent'),
//           where("content", "!=", ''),
//           where("deleted", "==", null),
//           where("draft", "==", true),
//           where("sent_by", "==", userDocRef),
//           orderBy("created_at", "desc"),
//           limit(1)
//         )
//       );

//       console.log(draftsSnapshot)

//       if (!draftsSnapshot.empty) {
//         const queryDocumentSnapshots = draftsSnapshot.docs
//         const latestMessage = queryDocumentSnapshots[0].data()
//         messages.push({
//           letterboxId: doc.id,
//           collectionId: queryDocumentSnapshots[0].id,
//           receiver: letterboxData.members.find(memberRef => memberRef.id !== auth.currentUser.uid).id,
//           content: latestMessage.content,
//           draft: latestMessage.draft,
//           deleted: latestMessage.deleted_at,
//           created_at: latestMessage.created_at,
//         });
//       }

//       if (!sentLettersQuerySnapshot.empty) {
//         const queryDocumentSnapshots = sentLettersQuerySnapshot.docs
//         const latestMessage = queryDocumentSnapshots[0].data()
//         messages.push({
//           letterboxId: doc.id,
//           collectionId: queryDocumentSnapshots[0].id,
//           receiver: letterboxData.members.find(memberRef => memberRef.id !== auth.currentUser.uid).id,
//           content: latestMessage.content,
//           deleted: latestMessage.deleted_at,
//           created_at: latestMessage.created_at,
//         });
//       }

//       const pendingLettersQuerySnapshot = await getDocs(
//         query(lettersCollectionRef,
//           where("status", "==", 'pending_review'),
//           where("deleted_at", "==", null),
//           where("sent_by", "==", userDocRef),
//           orderBy("created_at", "desc"),
//           limit(10)
//         )
//       );

//       if (!pendingLettersQuerySnapshot.empty) {
//         const queryDocumentSnapshots = pendingLettersQuerySnapshot.docs
//         const latestMessage = queryDocumentSnapshots[0].data()
//         messages.unshift({
//           letterboxId: doc.id,
//           collectionId: queryDocumentSnapshots[0].id,
//           receiver: letterboxData.members.find(memberRef => memberRef.id !== auth.currentUser.uid).id,
//           content: latestMessage.content,
//           deleted: latestMessage.deleted_at,
//           created_at: latestMessage.created_at,
//           pending: true
//         });
//       }
//     }
//     console.log("MESSAGES", messages)
//     return messages
//   }
// };


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