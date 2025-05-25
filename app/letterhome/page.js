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

  return (
    <div className="bg-gray-100 min-h-screen py-6">
      {isLoading ? (
        <p>Loading...</p>
      ) : error ? (
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
                  <div key={letter.id + "_" + i}>
                    <a
                      href={`/letters/${letter.id}`}
                      className="flex items-center px-4 py-3 bg-white hover:bg-gray-50 transition-colors duration-300 cursor-pointer">
                      <div className="flex-grow">
                        {letter.recipients?.map((rec) => (
                          <div key={rec.id} className="flex">
                            <ProfileImage
                              photo_uri={rec?.photo_uri}
                              first_name={rec?.first_name}
                            />
                            <div className="flex flex-col ml-3">
                              <div className="flex justify-between w-full">
                                <h3 className="font-semibold text-gray-800">
                                  {rec.first_name} {rec.last_name}
                                  <span className="ml-2 text-sm text-gray-500">
                                    {rec.country}
                                  </span>
                                </h3>
                                <span className="text-xs text-gray-500">
                                  {letter.letters[0].received}
                                </span>
                              </div>

                              <div className="flex mt-1">
                                {/* {letter.letters[0].status === "draft" && (
                                  <span className="text-orange-500 font-medium mr-2">
                                    Draft
                                  </span>
                                )} */}
                                <p className="text-gray-600 truncate text-sm">
                                  {letter.letters[0].content ?? ""}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </a>
                    {i < letters.length - 1 && (
                      <hr className="border-gray-200 mx-4" />
                    )}
                  </div>
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
          onClick={iterateLetterBoxes}>
          Check For Inactive Chats
        </button>
      )}
    </div>
  );
}
