"use client";

// pages/index.js
import { useState, useEffect } from "react";
import { db, auth } from "../firebaseConfig"; // Adjust the import path as necessary
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import BottomNavBar from "../../components/bottom-nav-bar";
import * as Sentry from "@sentry/nextjs";
import { useRouter } from "next/navigation";
import {
  fetchDraft,
  fetchLetterbox,
  fetchLetterboxes,
  fetchRecipients,
} from "../utils/letterboxFunctions";
import { iterateLetterBoxes } from "../utils/deadChat";
import Button from "../../components/general/Button";
import ProfileHeader from "../../components/general/letter/ProfileHeader";
import LetterCard from "../../components/general/letter/LetterCard";
import EmptyState from "../../components/general/letterhome/EmptyState";
import { BackButton } from "../../components/general/BackButton";
import { PageContainer } from "../../components/general/PageContainer";
import { PageBackground } from "../../components/general/PageBackground";

const fetchLatestLetterFromLetterbox = async (letterboxId, userRef) => {
  const letterboxRef = doc(collection(db, "letterbox"), letterboxId);
  const lRef = collection(letterboxRef, "letters");

  // My Letters
  const userLettersQuery = query(
    lRef,
    where("sent_by", "==", userRef),
    orderBy("created_at", "desc"),
    limit(1) // grab a few in case of fallback
  );

  // Your letters
  const sentLettersQuery = query(
    lRef,
    where("status", "==", "sent"),
    orderBy("created_at", "desc"),
    limit(1)
  );

  // Run both in parallel
  const [userLettersSnap, sentLettersSnap] = await Promise.all([
    getDocs(userLettersQuery),
    getDocs(sentLettersQuery),
  ]);

  const allLetters = [];

  if (!userLettersSnap?.empty)
    userLettersSnap.forEach((doc) => {
      allLetters.push({ id: doc?.id, ...doc?.data() });
    });

  if (!sentLettersSnap?.empty)
    sentLettersSnap.forEach((doc) => {
      if (doc?.data()?.sent_by?.id !== userRef?.id)
        allLetters.push({ id: doc?.id, ...doc?.data() });
    });

  if (allLetters.length === 0) return null;
  else if (allLetters.length === 1) return allLetters[0];
  else if (
    allLetters[0]?.created_at?.toDate?.() > allLetters[1]?.created_at?.toDate?.()
  )
    return allLetters[0];
  else return allLetters[1];
};

export default function Home() {
  const [userName, setUserName] = useState("");
  const [userType, setUserType] = useState("");
  const [country, setCountry] = useState("");
  const [letters, setLetters] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [userId, setUserId] = useState("");
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
            const letter =
              (await fetchLatestLetterFromLetterbox(id, userRef)) || {};
            const rec = await fetchRecipients(id);
            const recipient = rec?.[0] ?? {};

            return {
              id: letter.id || "",
              profileImage: recipient?.photo_uri || "",
              name: `${recipient.first_name ?? "Unknown"} ${
                recipient.last_name ?? ""
              }`,
              country: recipient.country ?? "Unknown",
              lastMessage: letter.content || "",
              lastMessageDate: letter.created_at || "",
              status: letter.status || "",
              letterboxId: id || "",
              recipient: recipient?.id || "",
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
    setIsLoading(true);
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        // TODO: redirect if everything is loaded and still no user
        setError("No user logged in.");
        setIsLoading(false);
        router.push("/login");
      } else {
        const letterboxes = await fetchLetterboxes();
        const letterboxIds = letterboxes.map((l) => l.id);
        let letters = [];
        for (const id of letterboxIds) {
          const letterbox = { id };
          const userRef = doc(db, "users", auth.currentUser.uid);
          const draft = await fetchDraft(id, userRef, true);
          if (draft) {
            letterbox.letters = [draft];
          } else {
            letterbox.letters = await fetchLetterbox(id, 1);
          }
          letters.push(letterbox);
        }
        // this will be slow but may be the only way
        for await (const l of letters) {
          const rec = await fetchRecipients(l.id);
          l.recipients = rec;
        }
        setLetters(letters);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      if (auth.currentUser) {
        const uid = auth.currentUser.uid;
        setUserId(uid);
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
        }
      } else {
        console.log("No user logged in");
      }
    };

    fetchUserData();
  }, []);
  return (
    <PageBackground>
      <PageContainer maxWidth="lg">
        <BackButton />

        <div className="max-w-lg mx-auto bg-white shadow-md rounded-lg overflow-hidden">
          <ProfileHeader
            userName={userName}
            country={country}
            profileImage={profileImage}
            id={userId}
          />

          <main className="p-6">
            <section className="mt-8">
              <h2 className="text-xl mb-4 text-gray-800 flex justify-between items-center">
                Recent letters
              </h2>
              {letters.length > 0 ? (
                letters.map((letter, i) => (
                  <LetterCard key={letter.id + "_" + i} letter={letter} uid={auth.currentUser.uid} />
                ))
              ) : (
                <EmptyState
                  title="New friends are coming!"
                  description="Many friends are coming hang tight!"
                />
              )}
            </section>
          </main>
          <BottomNavBar />
        </div>

        {userType === "admin" && (
          <Button
            btnText="Check For Inactive Chats"
            color="bg-black"
            textColor="text-white"
            rounded="rounded-md"
            onClick={iterateLetterBoxes}
          />
        )}

        {/* Add animation keyframes */}
        <style jsx global>{`
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateX(30px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          .animate-slide-in {
            animation: slideIn 0.3s ease-out forwards;
          }
        `}</style>
      </PageContainer>
    </PageBackground>
  );
}
