"use client";

import { useState, useEffect } from "react";
import { db, auth } from "../../app/firebaseConfig";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { updateDoc } from "firebase/firestore";
import { doc, getDoc, setDoc } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";

//This is the send message button in the kid card. It also creates the connection between the user and the kid
export default function SendMessage({ kidId }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [kid, setKid] = useState([]);

  useEffect(() => {
    //This gets the penpal data
    const fetchUserData = async () => {  //this get the current logged in user. This is used throught the code. In the future we could make one and use that through out the code
      try {
        if (auth.currentUser) {
          const uid = auth.currentUser.uid;
          const docRef = doc(db, "users", uid);
          const docSnap = await getDoc(docRef);
          console.log(docSnap);

          if (docSnap.exists()) {
            const userData = docSnap.data();
            console.log(userData);
            setUser(userData);
          } else {
            console.error("No user logged in");
            router.push("/login");
          }
        }
      } catch (error) {
        console.error(
          "There has been a error fetching the logged in user",
          error
        );
      }
    };

    const fetchKidData = async () => {
        try {
            if(kidId) {
            const userDocRef = doc(db, "users", kidId); 
            const userDocSnapshot = await getDoc(userDocRef);
        
            if (userDocSnapshot.exists()) {
              const userData = userDocSnapshot.data();
              console.log(userData)
              return userData;
            } else {
              console.log("User document does not exist");
              return null;
            }
        } else {
            console.log("No valid kidId")
        }
        } catch(error) {
            console.error("There has been a error fetching the kid", error);
        }
    }

    fetchUserData();
    fetchKidData();
  }, [auth.currentUser, kidId]);

  return (
    <div>
      {/* <Link href="/letterwrite"> */}
        <button
          className="w-28 py-2 rounded-3xl text-center text-xs"
          style={{ backgroundColor: "#034792", color: "white" }}
        >
          Send a message
        </button>
    </div>
  );
}
