"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { db, auth } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import BottomNavBar from "@/components/bottom-nav-bar";
import * as Sentry from "@sentry/nextjs";

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
          
          if (user.user_type !== "admin") {
            setError("Not Admin");
            setIsLoading(false);
            router.push("/letterhome");
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
            const letterboxes = await fetchLetterboxes();
            if (letterboxes && letterboxes.length > 0) {
              const letterboxIds = letterboxes.map((l) => l.id);
              let fetchedLetters = [];
    
              for (const id of letterboxIds) {
                const letterbox = { id };
                const userRef = doc(db, "users", user.uid);
                const draft = await fetchDraft(id, userRef, true);
    
                if (draft) {
                  letterbox.letters = [draft];
                } else {
                  letterbox.letters = await fetchLetterbox(id, 1);
                }
                fetchedLetters.push(letterbox);
              }
    
              // Fetch recipients for each letterbox
              for await (const l of fetchedLetters) {
                const rec = await fetchRecipients(l.id);
                l.recipients = rec;
              }
    
              setLetters(fetchedLetters);
            }
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
    return (
        <>
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4 relative">
                <p>Hello</p>

                <BottomNavBar />
            </div>
        </>
    );
}