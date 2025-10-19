"use client";

import { useState, useEffect } from "react";
import { db, auth } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import NavBar from "../../components/bottom-nav-bar";
import * as Sentry from "@sentry/nextjs";
import { useRouter } from "next/navigation";
import ConversationList from "../../components/general/ConversationList";
import {
  fetchLatestLetterFromLetterbox,
  fetchLetterboxes,
  fetchRecipients,
} from "../utils/letterboxFunctions";

import { deadChat, iterateLetterBoxes } from "../utils/deadChat";
import LetterHomeSkeleton from "../../components/loading/LetterHomeSkeleton";
import Button from "../../components/general/Button";
import ProfileHeader from "../../components/general/letter/ProfileHeader";
import EmptyState from "../../components/general/letterhome/EmptyState";
import { BackButton } from "../../components/general/BackButton";
import { PageBackground } from "../../components/general/PageBackground";
import { useUser } from "../../contexts/UserContext";

export default function Home() {
  const { user, userData, userType, profileImage } = useUser();
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showWelcome, setShowWelcome] = useState(false);
  const [userId, setUserId] = useState("");
  const router = useRouter();

  const getConversations = async (uid) => {
    try {
      const letterboxes = await fetchLetterboxes();
      if (letterboxes && letterboxes.length > 0) {
        const letterboxIds = letterboxes.map((l) => l.id);

        const fetchedConversations = await Promise.all(
          letterboxIds.map(async (id) => {
            const userRef = doc(db, "users", uid);
            const letter =
              (await fetchLatestLetterFromLetterbox(id, userRef)) || {};
            const rec = await fetchRecipients(id);
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
              letterboxId: id || "",
              isRecipient: letter?.sent_by?.id !== uid,
              unread: letter?.unread || false,
            };
          })
        );
        return fetchedConversations;
      } else {
        setError("No conversations found.");
        return [];
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      Sentry.captureException(err);
      setError("Failed to load data.");
      return [];
    }
  };

  useEffect(() => {
    if (!user) return; // Wait for user from context

    const fetchConversations = async () => {
      setIsLoading(true);
      try {
        const userConversations = await getConversations(user.uid);
        setConversations(userConversations);
      } catch (err) {
        console.error("Error fetching conversations:", err);
        setError("Failed to load conversations.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversations();
  }, [user]); // Re-fetch if user changes

  if (isLoading) {
    return <LetterHomeSkeleton />;
  }

  return (
    <>
      <PageBackground className="py-0">
      <div className="
        w-full 
        max-w-lg
        undefined
        
        
        bg-white 
        rounded-lg 
        shadow-md
        
      ">
        {/* <div className="w-full bg-gray-100 min-h-screen py-24 fixed top-0 left-0 z-[100]"> */}
          <BackButton />
          <div className="max-w-lg mx-auto bg-white shadow-md rounded-lg overflow-hidden">
            <ProfileHeader
              userName={userData?.first_name || "Unknown User"}
              country={userData?.country || "Unknown Country"}
              profileImage={profileImage}
              id={user?.uid || ""}
            />
            <main className="p-6 bg-white">
              <section className="">
                {conversations.length > 0 ? (
                  <ConversationList conversations={conversations} />
                ) : (
                  <EmptyState
                    title="New friends are coming!"
                    description="Many friends are coming hang tight!"
                  />
                )}
              </section>
            </main>

            <NavBar />
          </div>
        {/* </div> */}
        {userType === "admin" && (
          <Button
            btnText="Check For Inactive Chats"
            color="bg-black"
            textColor="text-white"
            rounded="rounded-md"
            onClick={iterateLetterBoxes}
          />
        )}
        </div>
        </PageBackground>
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
    </>
  );
}
