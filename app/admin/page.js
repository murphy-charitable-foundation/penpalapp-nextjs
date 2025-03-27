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
    const [hasMore, setHasMore] = useState(true);
    const [selectedStatus, setSelectedStatus] = useState("draft"); // Default filter
    const [selectedDate, setSelectedDate] = useState(""); // Optional category filter
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
          // Fetch initial batch of letters
          await fetchLetters();
        } catch (err) {
          console.error("Error fetching data:", err);
          setError("Failed to load data.");
        } finally {
          setIsLoading(false);
        }
      });
  
      return () => unsubscribe();
    }, [router]);

    
  const fetchLetters = async (nextPage = false) => {
    try {
      let lettersQuery = collectionGroup(db, "letters");

      // 🔹 Apply Filters Dynamically
      const queryConstraints = [where("status", "==", selectedStatus), limit(PAGE_SIZE)];
      
      if (nextPage && lastDoc) {
        queryConstraints.push(startAfter(lastDoc));
      }

      lettersQuery = query(lettersQuery, ...queryConstraints);

      const querySnapshot = await getDocs(lettersQuery);

      if (!querySnapshot.empty) {
        const newDocs = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setDocuments((prev) => [...prev, ...newDocs]);
        setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1]); // Store last doc for pagination
      } else {
        setHasMore(false); // No more documents to load
      }
    } catch (err) {
      console.error("Error fetching more letters:", err);
      setError("Failed to load more data.");
    }
  };

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
                
                {/* Load More Button */}
                {hasMore && !isLoading && (
                  <button
                    onClick={() => fetchLetters(true)}
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
                  >
                    Load More
                  </button>
                )}
                <BottomNavBar />
            </div>
        </>
    );
}