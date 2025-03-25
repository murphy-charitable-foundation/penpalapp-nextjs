"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { db, auth } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import BottomNavBar from "@/components/bottom-nav-bar";
import * as Sentry from "@sentry/nextjs";
import { useRouter } from "next/navigation";
import { FaUserCircle, FaCog, FaBell, FaPen } from "react-icons/fa";
import {
  fetchDraft,
  fetchLetterbox,
  fetchLetterboxes,
  fetchRecipients,
} from "../utils/letterboxFunctions";
import { deadChat, iterateLetterBoxes } from "../utils/deadChat";
import ProfileImage from "@/components/general/ProfileImage";

export default function Home() {
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

  // Skeleton loading component
  if (isLoading) {
    return (
      <div className="bg-gray-100 min-h-screen py-6">
        <div className="max-w-lg mx-auto bg-white shadow-md rounded-lg overflow-hidden animate-pulse">
          {/* Header Skeleton */}
          <div className="flex justify-between items-center bg-blue-100 p-5 border-b border-gray-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gray-300 rounded-full" />
              <div className="ml-3">
                <div className="h-4 w-24 bg-gray-300 rounded mb-2" />
                <div className="h-3 w-16 bg-gray-300 rounded" />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="h-7 w-7 bg-gray-300 rounded" />
              <div className="h-7 w-7 bg-gray-300 rounded" />
              <div className="h-7 w-7 bg-gray-300 rounded" />
            </div>
          </div>
          {/* Main Skeleton */}
          <main className="p-6">
            <section className="mt-8">
              <div className="flex justify-between items-center mb-4">
                <div className="h-6 w-32 bg-gray-300 rounded" />
                <div className="h-8 w-20 bg-gray-300 rounded" />
              </div>
              <div>
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center p-4 mb-3 rounded-lg bg-white shadow-md animate-pulse"
                  >
                    <div className="flex-grow">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-8 h-8 bg-gray-300 rounded-full" />
                        <div className="h-4 w-24 bg-gray-300 rounded" />
                      </div>
                      <div className="h-3 w-full bg-gray-300 rounded mb-1" />
                      <div className="h-3 w-1/2 bg-gray-300 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen py-6">
      {error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <div className="max-w-lg mx-auto bg-white shadow-md rounded-lg overflow-hidden">
          <header className="flex justify-between items-center bg-blue-100 p-5 border-b border-gray-200">
            <Link href="/profile">
              <button className="flex items-center text-gray-700">
                <ProfileImage photo_uri={profileImage} first_name={userName} />
                <div className="ml-3">
                  <div className="font-semibold text-lg">{userName}</div>
                  <div className="text-sm text-gray-600">{country}</div>
                </div>
              </button>
            </Link>

            <div className="flex items-center space-x-4">
              <Link href="/settings">
                <button className="text-gray-700 hover:text-blue-600">
                  <FaCog className="h-7 w-7" />
                </button>
              </Link>
              <Link href="/discover">
                <button className="text-gray-700 hover:text-blue-600">
                  <FaBell className="h-7 w-7" />
                </button>
              </Link>
              <Link href="/letterwrite">
                <button className="text-gray-700 hover:text-blue-600">
                  <FaPen className="h-7 w-7" />
                </button>
              </Link>
            </div>
          </header>

          <main className="p-6">
            <section className="mt-8">
              <h2 className="font-bold text-xl mb-4 text-gray-800 flex justify-between items-center">
                Last letters
                <Link href="/letterhome">
                  <button className="px-3 py-1 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-300">
                    Show more
                  </button>
                </Link>
              </h2>
              {letters.length > 0 ? (
                letters.map((letter, i) => (
                  <a
                    key={letter.id + "_" + i}
                    href={`/letters/${letter.id}`}
                    className="flex items-center p-4 mb-3 rounded-lg bg-white shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer"
                  >
                    <div className="flex-grow">
                      {letter.recipients?.map((rec) => (
                        <div key={rec.id} className="flex mt-3">
                          <ProfileImage
                            photo_uri={rec?.photo_uri}
                            first_name={rec?.first_name}
                          />
                          <div className="flex flex-col">
                            <div className="flex">
                              {letter.letters[0].status === "draft" && (
                                <h4 className="mr-2">[DRAFT]</h4>
                              )}
                              <h3 className="font-semibold text-gray-800">
                                {rec.first_name} {rec.last_name}
                              </h3>
                            </div>
                            <div>{rec.country}</div>
                          </div>
                        </div>
                      ))}
                      <p className="text-gray-600 truncate">
                        {letter.letters[0].content ?? ""}
                      </p>
                      <span className="text-xs text-gray-400">
                        {letter.letters[0].received}
                      </span>
                    </div>
                  </a>
                ))
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
          onClick={iterateLetterBoxes}
        >
          Check For Inactive Chats
        </button>
      )}
    </div>
  );
}
