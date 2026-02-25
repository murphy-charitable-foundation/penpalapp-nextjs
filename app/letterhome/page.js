"use client";

import { useState, useEffect } from "react";
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

import LettersSkeleton from "../../components/loading/LettersSkeleton";
import { deadChat, iterateLetterBoxes } from "../utils/deadChat";
import ProfileImage from "/components/general/ProfileImage";
import LetterHomeSkeleton from "../../components/loading/LetterHomeSkeleton";
import Button from "../../components/general/Button";
import ProfileHeader from "../../components/general/letter/ProfileHeader";
import EmptyState from "../../components/general/letterhome/EmptyState";
import { PageContainer } from "../../components/general/PageContainer";
import { PageBackground } from "../../components/general/PageBackground";
import Dialog from "../../components/general/Dialog";
import { logError } from "../utils/analytics";
import { usePageAnalytics } from "../useAnalytics";
import AuthGuard from "../../components/AuthGuard";

export default function Home() {
  const [userName, setUserName] = useState("");
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

      if (!letterboxes || letterboxes.length === 0) {
        setError("No conversations found.");
        throw new Error("No letterboxes found.");
      }

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
    } catch (err) {
      logError(err, {
        description: "Error fetching conversations",
      });
      setError("Failed to load data.");
      throw err;
    }
  };

 useEffect(() => {
  const fetchData = async () => {
    setIsLoading(true);

    const user = auth.currentUser;
    if (!user) return; // AuthGuard handles blocking

    const uid = user.uid;
    setUserId(uid);

    try {
      const userData = await getUserData(uid);
      setUserName(userData.first_name || "Unknown User");

      const downloaded = await getUserPfp(uid);
      setProfileImage(downloaded || "");

      const userConversations = await getConversations(uid);
      setConversations(userConversations);
    } catch (err) {
      console.error(err);
      setError("Failed to load data.");
    } finally {
      setIsLoading(false);
    }
  };

  fetchData();
}, []);

  return (
      <AuthGuard>
        <PageBackground className="bg-gray-100 h-screen flex flex-col overflow-hidden">
        <PageContainer
          width="compactXS"
          padding="none"
          center={false}
          className="min-h-[100dvh] flex flex-col bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          {isLoading && <LetterHomeSkeleton />}
          {!isLoading && (
            <>
              {/* HEADER */}
              <div className="shrink-0 border-b">
                <ProfileHeader
                  userName={userName}
                  profileImage={profileImage}
                  id={userId}
                  showCountry={false}
                />
              </div>

              {/* SCROLLABLE LIST */}
              <div className="flex-1 min-h-0 overflow-y-auto px-3">
                {conversations.length > 0 ? (
                  <ConversationList conversations={conversations} />
                ) : (
                  <EmptyState
                    title="New friends are coming!"
                    description="Many friends are coming — hang tight!"
                  />
                )}
              </div>

              {/* NAVBAR */}
              <div className="shrink-0 border-t bg-blue-100 rounded-b-2xl">
                <NavBar />
              </div>
            </>
          )}
        </PageContainer>
      </PageBackground>
    </AuthGuard>);
}
