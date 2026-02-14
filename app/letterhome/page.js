"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import Link from "next/link";
import { db, auth } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import NavBar from "../../components/bottom-nav-bar";
import { useRouter } from "next/navigation";
import ConversationList from "../../components/general/ConversationList";
import {
  getUserPfp,
  fetchLatestLetterFromLetterbox,
  fetchLetterboxes,
  fetchRecipients,
} from "../utils/letterboxFunctions";

import LetterHomeSkeleton from "../../components/loading/LetterHomeSkeleton";
import { iterateLetterBoxes } from "../utils/deadChat";
import ProfileHeader from "../../components/general/letter/ProfileHeader";
import EmptyState from "../../components/general/letterhome/EmptyState";
import { BackButton } from "../../components/general/BackButton";
import { PageContainer } from "../../components/general/PageContainer";
import { PageBackground } from "../../components/general/PageBackground";
import { logButtonEvent, logError } from "../utils/analytics";
import { usePageAnalytics } from "../useAnalytics";
import Button from "../../components/general/Button";

export default function Home() {
  const [userName, setUserName] = useState("");
  const [userType, setUserType] = useState("");
  const [country, setCountry] = useState("");
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [userId, setUserId] = useState("");

  const router = useRouter();
  usePageAnalytics("/letterhome");

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

  const getConversations = async (uid) => {
    try {
      const letterboxes = await fetchLetterboxes();

      if (!letterboxes?.length) {
        setError("No conversations found.");
        throw new Error("No letterboxes found.");
      }

      const fetchedConversations = await Promise.all(
        letterboxes.map(async (letterbox) => {
          const userRef = doc(db, "users", uid);
          const letter =
            (await fetchLatestLetterFromLetterbox(letterbox.id, userRef)) || {};
          const rec = await fetchRecipients(letterbox.id);
          const recipient = rec?.[0] ?? {};

          return {
            id: letter?.id,
            profileImage: recipient?.photo_uri || "",
            name: `${recipient.first_name ?? "Unknown"} ${
              recipient.last_name ?? ""
            }`,
            country: recipient.country ?? "Unknown",
            lastMessage: letter.content || "",
            lastMessageDate: letter.created_at || "",
            status: letter.status || "",
            letterboxId: letterbox.id || "",
            isRecipient: letter?.sent_by?.id !== uid,
            unread: letter?.unread || false,
          };
        })
      );

      return fetchedConversations;
    } catch (err) {
      logError(err, { description: "Error fetching conversations" });
      setError("Failed to load data.");
      throw err;
    }
  };

  // Firebase Auth Redirect Guard
  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

    try {
      const uid = user.uid;
      setUserId(uid);

      const userData = await getUserData(uid);

      const profileComplete =
        userData.first_name &&
        userData.last_name &&
        userData.country;

      if (!profileComplete) {
        router.push("/profile");
        return;
      }

      setUserName(userData.first_name || "Unknown User");
      setCountry(userData.country || "Unknown Country");
      setUserType(userData.user_type || "Unknown Type");

      const downloaded = await getUserPfp(uid);
      setProfileImage(downloaded || "");

      const userConversations = await getConversations(uid);
      setConversations(userConversations);
    } catch (err) {
      console.error(err);
      setError("Error fetching user data or conversations.");
    } finally {
      setIsLoading(false);
    }
  });

  return () => unsubscribe();
}, [router]);

  return (
    <PageBackground>
      <PageContainer maxWidth="lg">
        {isLoading ? (
          <LetterHomeSkeleton />
        ) : (
          <>
            <div className="w-full bg-gray-100 min-h-screen py-24 fixed top-0 left-0 z-[100]">
              <BackButton />

              <div className="max-w-lg mx-auto bg-white shadow-md rounded-lg overflow-hidden">
                <ProfileHeader
                  userName={userName}
                  country={country}
                  profileImage={profileImage}
                  id={userId}
                />

                <main className="p-6 bg-white">
                  <section className="mt-8">
                    {conversations.length > 0 ? (
                      <ConversationList conversations={conversations} />
                    ) : (
                      <EmptyState
                        title="New friends are coming!"
                        description="Many friends are coming — hang tight!"
                      />
                    )}
                  </section>
                </main>

                <NavBar />
              </div>
            </div>

            {userType === "admin" && (
              <Button
                btnText="Check For Inactive Chats"
                color="bg-black"
                textColor="text-white"
                rounded="rounded-md"
                onClick={() => {
                  logButtonEvent(
                    "check for inactive chats button clicked",
                    "/letterhome"
                  );
                  iterateLetterBoxes();
                }}
              />
            )}
          </>
        )}
      </PageContainer>
    </PageBackground>
  );
}
