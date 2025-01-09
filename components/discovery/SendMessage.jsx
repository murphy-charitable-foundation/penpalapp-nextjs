"use client";

import { useState, useEffect } from "react";
import { db, auth } from "../../app/firebaseConfig";
import { addDoc, doc, updateDoc, arrayUnion,getDoc,setDoc,getDocs,query,collection,where } from "firebase/firestore";
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

          
          const letterboxQuery = query(
            collection(db, "letterbox"),
            where("members", "array-contains", userDocRef) // Use reference, not string
          );

          const querySnapshot = await getDocs(letterboxQuery);

          let letterboxRef;

          if (!querySnapshot.empty) {
            //If a document exists, update it
            letterboxRef = querySnapshot.docs[0].ref;

            await updateDoc(letterboxRef, {
              members: arrayUnion(kidDocRef) // Add reference instead of string
            });

            console.log("Existing letterbox updated with new member.");
          } else {
            
            letterboxRef = await addDoc(collection(db, "letterbox"), {
              members: [
                userDocRef, 
                kidDocRef   
              ],
              letters: [],
              created_at: new Date().toISOString(),
              archived_at: null
            });

            console.log("New letterbox created with ID:", letterboxRef.id);
          }

          // Add a new letter to the `letters` subcollection
          const lettersCollectionRef = collection(letterboxRef, "letters");

          await addDoc(lettersCollectionRef, {
            attachments: [],
            created_at: new Date().toISOString(),
            deleted_at: null,
            letter: "Hello, nice to meet you!", 
            sent_by: userDocRef, // Use reference
            status: "draft"
          });

          console.log("New letter created in the letters subcollection.");

          // Update User and Kid documents
          await updateDoc(userDocRef, {
            connected_penpals: arrayUnion(kidDocRef),
          });

          await updateDoc(kidDocRef, {
            connected_penpals: arrayUnion(userDocRef),
            connected_penpals_count: kid.connected_penpals_count + 1,
          });

          console.log("User and Kid connected_penpals updated.");
          router.push("/letterhome");
        

          // const updatedUserConnectedPenpals = [
          //   ...connectedUserPenpals,
          //   doc(db, "users", kid.id),
          // ];

          // const updatedKidConnectedPenpals = [
          //   ...connectedKidPenpals,
          //   doc(db, "users", auth.currentUser.uid),
          // ];

          // const updateUser = await updateDoc(userDocRef, {
          //   connected_penpals: updatedUserConnectedPenpals,
          // });

          // const updateKid = await updateDoc(kidDocRef, {
          //   connected_penpals: updatedKidConnectedPenpals,
          // });

          // const kidConnectedPenPalCount = kid.connected_penpals_count;

          // const updatedKidConnectedPenPalCount = kidConnectedPenPalCount + 1;

          // const updateConnectedPenpalsCount = await updateDoc(kidDocRef, {
          //   connected_penpals_count: updatedKidConnectedPenPalCount,
          // });

          // router.push("/letterhome");
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
