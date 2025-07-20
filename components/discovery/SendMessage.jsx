"use client";

import { useState, useEffect } from "react";
import { db, auth } from "../../app/firebaseConfig";
import { addDoc, doc, updateDoc, arrayUnion,getDoc,getDocs,query,collection,where } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Button from "../general/Button";
import { logError } from "../../app/utils/analytics";

//This is the send message button in the kid card. It also creates the connection between the user and the kid
export default function SendMessage({ kid }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [userRef, setUserRef] = useState(null);
  const [kidRef, setKidRef] = useState();

  useEffect(() => {
    //This gets the penpal data
    const fetchUserData = async () => {
      //this get the current logged in user. This is used throught the code. In the future we could make one and use that through out the code
      try {
        if (auth.currentUser) {
          const uid = auth.currentUser.uid;
          const docRef = doc(db, "users", uid);
          // Unnecessary getDoc
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

  const createConnection = async () => {
    try {
      console.log("Kid:", kid);
      console.log("User:", user);

      if (kid != null && user != null) {
        if (kid.connected_penpals_count < 3) {
          // Define references for user and kid
          const userDocRef = doc(db, "users", auth.currentUser.uid);
          const kidDocRef = doc(db, "users", kid.id);

          // query DB to check for existing letterbox
          let letterboxQuery = query(
            collection(db, "letterbox"),
            where("members", "==", [userDocRef, kidDocRef]) // Use reference, not string
          );
          // Unnecessary getDoc
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

            console.log("Letterbox created");

            await addDoc(collection(letterboxRef, "letters"), {
              sent_by: userRef,
              content: "Please complete your first letter here...",
              status: "draft",
              created_at: new Date(),
              deleted: null
            });

            // Update User and Kid documents
            await updateDoc(userDocRef, {
              connected_penpals: arrayUnion(kidDocRef),
            });

            await updateDoc(kidDocRef, {
              connected_penpals: arrayUnion(userDocRef),
              connected_penpals_count: kid.connected_penpals_count + 1,
            });

            router.push("/letters/" + letterboxRef.id);
          } else {
            router.push("/letters/" + querySnapshot.docs[0].id);
            console.log("Letterbox already exists");
            logError("Penpal filter error -- Letterbox already exists.", {
              description: "debug",
            });
          }
        } else {
          console.log("Kid has exceeded penpal limit");
        }
      } else {
        console.log("No kid or user data");
      }
    } catch (error) {
      console.log("There has been a error creating the connection: ", error);
    }
  };

  const handleClick = async () => {
    createConnection();
  };

  return (
    <div>
      <Button
        btnText="Send a message"
        color="bg-[#034792]"
        textColor="text-white"
        font="font-bold"
        rounded="rounded-3xl"
        size="w-28 py-2 rounded-3xl text-center text-xs"
        onClick={handleClick}
      />
    </div>
  );
}
