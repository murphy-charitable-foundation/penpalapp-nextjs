"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { db, auth } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import BottomNavBar from "@/components/bottom-nav-bar";
import * as Sentry from "@sentry/nextjs";
import { useRouter } from "next/navigation";
import ProfileImage from "@/components/general/ProfileImage";
import LetterList from "@/components/LetterList";
import {
  fetchDraft,
  fetchLetterboxes,
  fetchRecipients,
} from "../utils/letterboxFunctions";

const fetchLatestLetterFromLetterbox = async (letterboxId, userRef) => {
  const draft = await fetchDraft(letterboxId, userRef, true);
  if (draft) return draft;

  const lettersRef = collection(db, "letterboxes", letterboxId, "letters");
  const q = query(lettersRef, orderBy("created_at", "desc"), limit(1));
  const letterSnapshot = await getDocs(q);
  let letter;
  letterSnapshot.forEach((doc) => {
    letter = { id: doc.id, ...doc.data() };
  });
  console.log(letter);
  return letter;
};

export default function Home() {
  const [userName, setUserName] = useState("");
  const [userType, setUserType] = useState("");
  const [country, setCountry] = useState("");
  const [letters, setLetters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [currentUid, setCurrentUid] = useState("");
  const router = useRouter();

  const getUserData = async (uid) => {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      setError("User data not found.");
      throw new Error("No user document found.");
    }
  };

  const getLetterboxes = async (uid) => {
    try {
      const letterboxes = await fetchLetterboxes();
      if (letterboxes && letterboxes.length > 0) {
        const letterboxIds = letterboxes.map((l) => l.id);

        const fetchedLetterboxes = await Promise.all(
          letterboxIds.map(async (id) => {
            const userRef = doc(db, "users", uid);
            const letter = (await fetchLatestLetterFromLetterbox(id, userRef)) || {};
            const rec = await fetchRecipients(id);
            const recipient = rec?.[0] ?? {};
            return {
              id,
              profileImage: recipient?.photo_uri || "",
              name: `${recipient.first_name ?? "Unknown"} ${recipient.last_name ?? ""}`,
              country: recipient.country ?? "Unknown",
              lastMessage: letter.content || "",
              lastMessageDate: letter.created_at || "",
              status: letter.status || "",
              letterboxId: id || "",
              recipient: recipient?.id || "",
              unread: letter?.unread
            };
          })
        );

        return fetchedLetterboxes;
      } else {
        setError("No conversations found.");
        throw new Error("No letterboxes found.");
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      Sentry.captureException(err);
      setError("Failed to load data.");
      throw err;
    }
  };

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
        const uid = user.uid;

        const userData = await getUserData(uid);
        setCurrentUid(uid);
        setUserName(userData.first_name || "Unknown User");
        setCountry(userData.country || "Unknown Country");
        setUserType(userData.user_type || "Unknown Type");
        setProfileImage(userData?.photo_uri || "");

        const userLetterboxes = await getLetterboxes(uid);
        setLetters(userLetterboxes);
      } catch (err) {
        setError("Error fetching user data or conversations.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  return (
    <div className="bg-gray-100 min-h-screen py-6">
      {isLoading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <div className="max-w-lg mx-auto shadow-md rounded-lg overflow-hidden">
          <header className="flex justify-between items-center p-5 border-b border-gray-200">
            <Link href="/profile">
              <button className="flex items-center text-gray-700">
                <ProfileImage photo_uri={profileImage} first_name={userName} />
                <div className="ml-3">
                  <div className="font-semibold text-lg">{userName}</div>
                  <div className="text-sm text-gray-600">{country}</div>
                </div>
              </button>
            </Link>
          </header>

          <main className="p-6 bg-white">
            <section className="mt-8">
              {letters.length > 0 ? (
                <LetterList letters={letters} user={currentUid} />
              ) : (
                <p className="text-gray-500">No letters found.</p>
              )}
            </section>
          </main>

          <BottomNavBar />
        </div>
      )}

      {userType === "admin" && (
        <button
          className="flex bg-black text-white rounded py-4 px-4 mt-4 mx-auto"
          onClick={() => console.log("Check For Inactive Chats")}
        >
          Check For Inactive Chats
        </button>
      )}
    </div>
  );
}