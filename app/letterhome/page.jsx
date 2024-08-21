"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { db, auth } from "../firebaseConfig"; // Adjust the import path as necessary
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore";

import BottomNavBar from "@/components/bottom-nav-bar";

import { FaUserCircle, FaPen } from "react-icons/fa";
import LetterCard from "@/components/letter/LetterCard";

export default function Home() {
  const [username, setUsername] = useState("");
  const [country, setCountry] = useState("");
  const [lastLetters, setLastLetters] = useState([]);
  const [letters, setLetters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      if (auth.currentUser) {
        const uid = auth.currentUser.uid;
        const docRef = doc(db, "users", uid);
        const docSnap = await getDoc(docRef);

        console.log(docSnap);

        if (docSnap.exists()) {
          const userData = docSnap.data();

          // Assuming the user's name is stored under a 'name' field. Adjust as necessary.
          setUsername(userData?.first_name); // You can adjust this line to concatenate firstName and lastName if you want
          setCountry(userData?.country);
        } else {
          console.log("No such document!");
        }
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const fetchLetters = async () => {
          try {
            const userDocRef = doc(
              collection(db, "users"),
              auth.currentUser.uid
            );
            // const userDocSnapshot = await getDoc(userDocRef);
            const lettersRef = collection(db, "letterbox");
            const letterboxQuery = query(
              lettersRef,
              where("members", "array-contains", userDocRef)
            );
            const letterboxQuerySnapshot = await getDocs(letterboxQuery);

            const fetchedLetters = letterboxQuerySnapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
              received: doc.data().timestamp.toDate().toLocaleString(),
            }));

            setLetters(fetchedLetters);
          } catch (err) {
            setError("Failed to fetch letters. Please try again later.");
            console.error(err);
          } finally {
            setIsLoading(false);
          }
        };

        fetchLetters();
      } else {
        setError("No user logged in.");
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="bg-gray-100 min-h-screen py-6">
      <div className="max-w-lg mx-auto bg-white shadow-md rounded-lg overflow-hidden">
        <header className="flex justify-between items-center bg-blue-100 p-5 border-b border-gray-200">
          <Link href="/profile" className="flex items-center gap-2">
            <FaUserCircle className="h-10 w-10" />
            {isLoading ? (
              <div className="animate-pulse">
                <div className="h-6 bg-gray-300 rounded mb-2 w-3/4"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
              </div>
            ) : (
              <div>
                <h3 className="font-semibold">{username}</h3>
                <p className="text-sm text-gray-600">{country}</p>
              </div>
            )}
          </Link>

          <Link href="/letterwrite">
            <FaPen className="h-6 w-6" />
          </Link>
        </header>

        <main>
          <LetterCard
            unread={true}
            letter={{
              sender: "Angel Darwin",
              location: "Australia",
              message:
                "Hi, How is it going? I have been wondering if you have any plans next week. Are you still planning to Hi, How is it going? I have been wondering if you have any plans next week. Are you still planning to",
            }}
          />
          <LetterCard
            letter={{
              sender: "Angel Darwin",
              location: "Australia",
              message:
                "Hi, How is it going? I have been wondering if you have any plans next week. Are you still planning to Hi, How is it going? I have been wondering if you have any plans next week. Are you still planning to",
            }}
          />
          <LetterCard
            letter={{
              sender: "Angel Darwin",
              location: "Australia",
              message:
                "Hi, How is it going? I have been wondering if you have any plans next week. Are you still planning to Hi, How is it going? I have been wondering if you have any plans next week. Are you still planning to",
            }}
          />
          {letters.length ? (
            letters.map((letter) => (
              <LetterCard key={letter.id} letter={letter} />
            ))
          ) : (
            <p className="text-gray-500">No letters found.</p>
          )}
        </main>
        <BottomNavBar />
      </div>
    </div>
  );
}
