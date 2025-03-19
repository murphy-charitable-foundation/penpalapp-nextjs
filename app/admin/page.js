"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { db, auth } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import BottomNavBar from "@/components/bottom-nav-bar";
import * as Sentry from "@sentry/nextjs";
import { getFirestore, collectionGroup, doc, getDoc, getDocs, query, where, limit } from "firebase/firestore";
import {
  fetchDraft,
  fetchLetterbox,
  fetchLetterboxes,
  fetchRecipients,
} from "../utils/letterboxFunctions";
import { deadChat, iterateLetterBoxes } from "../utils/deadChat";
import ProfileImage from "@/components/general/ProfileImage";

export default function Admin() {
    const [userName, setUserName] = useState("");
    const [userType, setUserType] = useState("");
    const [country, setCountry] = useState("");
    const [letters, setLetters] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [profileImage, setProfileImage] = useState("");
    const [documents, setDocuments] = useState(null);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          setIsLoading(true);
    
          if (!user) {
            setError("No user logged in.");
            setIsLoading(false);
            router.push("/login");
            return;
          }
          

          try {
            // Fetch user data
            const uid = user.uid;
            const docRef = doc(db, "users", uid);
            const docSnap = await getDoc(docRef);
    
            if (docSnap.exists()) {
              const userData = docSnap.data();
              setUserName(userData.first_name || "Unknown User");
              setCountry(userData.country || "Unknown Country");
              setUserType(userData.user_type || "Unknown Type");
              setProfileImage(userData?.photo_uri || "");
            } else {
              console.log("No such document!");
              setError("User data not found.");
            }
    
            // Fetch letterboxes
            const commentsQuery = query(
              collectionGroup(db, "letters"), 
              where("status", "==", "draft"),
              limit(5) // Example filter
            );
            

            const querySnapshot = await getDocs(commentsQuery);
            const documents = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setDocuments(documents);

          } catch (err) {
            console.error("Error fetching data:", err);
            Sentry.captureException(err);
            setError("Failed to load data.");
          } finally {
            setIsLoading(false);
          }
        });
    
        return () => unsubscribe();
      }, [router]);

    if (documents == null) {
      return <p>Loading....</p>
    }
    
    return (
        <>
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4 relative">
                <p>Hello</p>
                
                {documents.map((doc) => (
                      <div key={doc.id} className="letter" style={{backgroundColor: '#F1F8EB', padding: '1rem', color: 'black'}}>
                          <h3>{doc.id || "Untitled"}</h3>
                          <p>{doc.letter || "No content available."}</p>
                      </div>
                ))}
          
                <BottomNavBar />
            </div>
        </>
    );
}