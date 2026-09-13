"use client";

import { useState, useEffect } from "react";
import { db, auth } from "../../app/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Button from "../general/Button";
import { createConnection } from "../../app/utils/conversationsFunctions";
import { logError, logButtonEvent } from "../../app/utils/analytics";

//This is the send message button in the kid card. It also creates the connection between the user and the kid
export default function SendMessage({ kid }) {
  const router = useRouter();
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
            setUserRef(docRef);
          }
        } else {
          logError(new Error("No user logged in"), {
            description: "Attempted to fetch user data without a logged-in user.",
          });
          router.push("/login");
        }
      } catch (error) {
        logError(error, {
          description: "There has been a error fetching the logged in user",
        });
      }
    };

    fetchUserData();
  }, [router]);

  const handleClick = async () => {
    logButtonEvent("send message button clicked", "/discovery");
    createConnection(userRef, kid.ref).then((conversationsRef) => {
      router.push("/conversation/" + conversationsRef.id);
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
