"use client";

import { useState, useEffect } from "react";
import { db } from "../firebaseConfig";
import { useUser } from "../../contexts/UserContext";
import { doc, getDoc } from "firebase/firestore";
import NavBar from "../../components/bottom-nav-bar";
import ConversationList from "../../components/general/ConversationList";
import {
  getUserPfp,
  fetchLatestLetterFromLetterbox,
  fetchLetterboxes,
  fetchRecipients,
} from "../utils/letterboxFunctions";

import LetterHomeSkeleton from "../../components/loading/LetterHomeSkeleton";
import ProfileHeader from "../../components/general/letter/ProfileHeader";
import EmptyState from "../../components/general/letterhome/EmptyState";
import { PageContainer } from "../../components/general/PageContainer";
import { PageBackground } from "../../components/general/PageBackground";
import { InactivityProvider } from "../contexts/InactivityContext";
import { logError } from "../utils/analytics";
import { usePageAnalytics } from "../useAnalytics";

export default function Home() {
  const [userName, setUserName] = useState("");
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [, setError] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [userId, setUserId] = useState("");
  const { user, userDocRef } = useUser();


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

  const toDateValue = (date) => date?.toDate?.() || date || new Date(0);

  const getConversations = async (uid) => {
    try {
      const letterboxes = await fetchLetterboxes();

      if (!letterboxes?.length) {
        setError("No conversations found.");
        return [];
      }

      const fetchedConversations = await Promise.all(
        letterboxes.map(async ({ id }) => {
          const letter =
            (await fetchLatestLetterFromLetterbox(id, userDocRef)) || {};
          const rec = await fetchRecipients(id);
          const recipient = rec?.[0] ?? {};

          return {
            id: letter?.id,
            profileImage: recipient?.photo_uri || "",
            name: `${recipient.first_name ?? "Unknown"} ${recipient.last_name ?? ""
              }`.trim(),
            country: recipient.country ?? "Unknown",
            lastMessage: letter.content || "",
            lastMessageDate: letter.drafted_at || letter.created_at || "",
            status: letter.status || "",
            letterboxId: id || "",
            isRecipient: letter?.sent_by?.id !== uid,
            unread: letter?.unread || false,
          };
        })
      );

      return fetchedConversations.sort(
        (a, b) => toDateValue(b.lastMessageDate) - toDateValue(a.lastMessageDate)
      );
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
      if (!user) return;

      setIsLoading(true);

      try {
        const uid = user.uid;
        setUserId(uid);

        const userData = await getUserData(uid);
        setUserName(userData.first_name || "Unknown User");

        const downloaded = await getUserPfp(uid);
        setProfileImage(downloaded || "");

        const userConversations = await getConversations(uid);
        setConversations(userConversations);
      } catch (err) {
        logError(err, {
          description: "Error loading user data and conversations",
        });
        setError("Failed to load data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);
  
  return (
    <InactivityProvider>
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
            <div className="shrink-0 border-b">
              <ProfileHeader
                userName={userName}
                profileImage={profileImage}
                id={userId}
                showCountry={false}
              />
            </div>

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

            <div className="shrink-0 border-t bg-blue-100 rounded-b-2xl">
              <NavBar />
            </div>
          </>
        )}
      </PageContainer>
      </PageBackground>
    </InactivityProvider>
  );
}
