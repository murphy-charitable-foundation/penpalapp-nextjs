"use client";

import { useState, useEffect } from "react";
import { db, auth } from "../../app/firebaseConfig";
import { updateDoc } from "firebase/firestore";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

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
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const userData = docSnap.data();
            console.log(userData);
            setUser(userData);
            setUserRef(docRef);
            return userData;
          }
        } else {
          console.error("No user logged in");
          router.push(`/login?url=${window.location.href}`);
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
          const connectedUserPenpals = user.connected_penpals || [];
          const connectedKidPenpals = kid.connected_penpals || [];

          const userDocRef = doc(db, "users", auth.currentUser.uid);
          const kidDocRef = doc(db, "users", kid.id);

          const updatedUserConnectedPenpals = [
            ...connectedUserPenpals,
            doc(db, "users", kid.id),
          ];

          const updatedKidConnectedPenpals = [
            ...connectedKidPenpals,
            doc(db, "users", auth.currentUser.uid),
          ];

          const updateUser = await updateDoc(userDocRef, {
            connected_penpals: updatedUserConnectedPenpals,
          });

          const updateKid = await updateDoc(kidDocRef, {
            connected_penpals: updatedKidConnectedPenpals,
          });

          const kidConnectedPenPalCount = kid.connected_penpals_count;

          const updatedKidConnectedPenPalCount = kidConnectedPenPalCount + 1;

          const updateConnectedPenpalsCount = await updateDoc(kidDocRef, {
            connected_penpals_count: updatedKidConnectedPenPalCount,
          });

          router.push("/letterhome");
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
      <button
        className="w-28 py-2 rounded-3xl text-center text-xs"
        style={{ backgroundColor: "#034792", color: "white" }}
        onClick={handleClick}
      >
        Send a message
      </button>
    </div>
  );
}
