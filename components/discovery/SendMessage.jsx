"use client";

import { useState, useEffect } from "react";
import { db, auth } from "../../app/firebaseConfig";
import { addDoc, doc, updateDoc, arrayUnion,getDoc,getDocs,query,collection,where } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Button from "../general/Button";
import { logError } from "../../app/utils/analytics";
import { createConnection } from "../../app/utils/letterboxFunctions";

//This is the send message button in the kid card. It also creates the connection between the user and the kid
export default function SendMessage({ kid }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [userRef, setUserRef] = useState(null);

  useEffect(() => {
    //This gets the penpal data
    const fetchUserData = async () => {
      //this get the current logged in user. This is used throught the code. In the future we could make one and use that through out the code
      try {
        if (auth.currentUser) {
          const uid = auth.currentUser.uid;
          const docRef = doc(db, "users", uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const userData = docSnap.data();
            setUser(userData);
            setUserRef(docRef);
            return userData;
          }
        } else {
          console.error("No user logged in");
          router.push("/login");
        }
      } catch (error) {
        console.error(
          "There has been a error fetching the logged in user",
          error
        );
      }
    };

    fetchUserData();
  }, [auth.currentUser]);

  const handleClick = async () => {
    createConnection(userRef, kid).then((letterboxRef) => {
      router.push("/letters/" + letterboxRef.id);
    });
  };

  return (
    <div>
      <Button
        btnText="Send a message"
        textColor="text-white"
        font="font-bold"
        rounded="rounded-3xl"
        size="w-28 py-2 rounded-3xl text-center text-xs"
        onClick={handleClick}
      />
    </div>
  );
}