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

import { iterateLetterBoxes } from "../utils/deadChat";
import LetterHomeSkeleton from "../../components/loading/LetterHomeSkeleton";
import ProfileHeader from "../../components/general/letter/ProfileHeader";
import EmptyState from "../../components/general/letterhome/EmptyState";
import { PageContainer } from "../../components/general/PageContainer";
import { PageBackground } from "../../components/general/PageBackground";
import { BackButton } from "../../components/general/BackButton";
import { logError, logButtonEvent } from "../utils/analytics";
import { usePageAnalytics } from "../useAnalytics";
import Button from "../../components/general/Button";

export default function Home() {
  const [userName, setUserName] = useState("");
  const [userType, setUserType] = useState("");
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
      throw new Error("No user document found.");
    }
  };

  const getConversations = async (uid) => {
    const letterboxes = await fetchLetterboxes();

    if (!letterboxes?.length) return [];

    const fetchedConversations = await Promise.all(
      letterboxes.map(async (letterbox) => {
        const userRef = doc(db, "users", uid);
        const letter =
          (await fetchLatestLetterFromLetterbox(letterbox.id, userRef)) || null;

        const rec = await fetchRecipients(letterbox.id);
        const recipient = rec?.[0] ?? {};

        return {
          id: letter?.id || letterbox.id,
          profileImage: recipient?.pfp || "",
          name: `${recipient.first_name ?? "Unknown"} ${
            recipient.last_name ?? ""
          }`,
          country: recipient.country ?? "Unknown",
          lastMessage: letter?.content || "",
          lastMessageDate: letter?.created_at || "",
          status: letter?.status || "",
          letterboxId: letterbox.id,
          isRecipient: letter?.sent_by
            ? letter.sent_by.id !== uid
            : false,
          unread: letter?.unread || false,
        };
      })
    );

    return fetchedConversations;
  };

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      try {
        const uid = user.uid;
        if (cancelled) return;

        setUserId(uid);

        const userData = await getUserData(uid);
        if (cancelled) return;

        const profileComplete =
          userData.first_name &&
          userData.last_name &&
          userData.country;

        if (!profileComplete) {
          router.push("/profile");
          return;
        }

        setUserName(userData.first_name || "Unknown User");
        setUserType(userData.user_type || "");

        const downloaded = await getUserPfp(uid);
        if (!cancelled) setProfileImage(downloaded || "");

        const userConversations = await getConversations(uid);
        if (!cancelled) setConversations(userConversations);

      } catch (err) {
        if (!cancelled) {
          console.error(err);
          setError("Error loading data.");
          logError(err, { description: "Letterhome load failure" });
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [router]);

  return (
    <PageBackground className="bg-gray-100 h-screen flex flex-col overflow-hidden">
      <PageContainer
        width="compactXS"
        padding="none"
        center={false}
        className="min-h-[100dvh] flex flex-col bg-white rounded-2xl shadow-lg overflow-hidden"
      >
        {isLoading && <LetterHomeSkeleton />}

          {!isLoading && error && (
            <div className="flex-1 flex items-center justify-center p-6 text-center text-red-600">
              {error}
            </div>
          )}

          {!isLoading && !error && (
          <>
            {/* Header */}
            <div className="shrink-0 border-b">
              <BackButton />
              <ProfileHeader
                userName={userName}
                profileImage={profileImage}
                id={userId}
                showCountry={false}
              />
            </div>

            {/* Scrollable Conversations */}
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

            {/* Admin Button */}
            {userType === "admin" && (
              <div className="px-3 py-2">
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
              </div>
            )}

            {/* Nav */}
            <div className="shrink-0 border-t bg-blue-100 rounded-b-2xl">
              <NavBar />
            </div>
          </>
        )}
      </PageContainer>
    </PageBackground>
  );
}
