"use client";

import { useState, useEffect } from "react";
import { db } from "../firebaseConfig";
import { useUser } from "../../contexts/UserContext";
import { doc, getDoc } from "firebase/firestore";

import NavBar from "../../components/bottom-nav-bar";
import ConversationList from "../../components/general/ConversationList";
import {
  getUserPfp,
  fetchLatestMessageFromConversations,
  fetchConversations,
  fetchRecipients,
} from "../utils/conversationsFunctions";

import InboxSkeleton from "../../components/loading/InboxSkeleton";
import ProfileHeader from "../../components/general/message/ProfileHeader";
import EmptyState from "../../components/general/inbox/EmptyState";
import { PageContainer } from "../../components/general/PageContainer";
import { PageBackground } from "../../components/general/PageBackground";
import { logError } from "../utils/analytics";
import { usePageAnalytics } from "../useAnalytics";

export default function Home() {
  const [userName, setUserName] = useState("");
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [, setError] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [userId, setUserId] = useState("");

  const { user } = useUser();

  usePageAnalytics("/inbox");

  const getUserData = async (uid) => {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data();
    }

    setError("User data not found.");
    throw new Error("No user document found.");
  };

  const getConversations = async (uid) => {
    try {
      const conversations = await fetchConversations();

      if (!conversations || conversations.length === 0) {
        setError("No conversations found.");
        throw new Error("No conversations found.");
      }

      const conversationIds = conversations.map((conversation) => conversation.id);

      const fetchedConversations = await Promise.all(
        conversationIds.map(async (id) => {
          const userRef = doc(db, "users", uid);

          const message =
            (await fetchLatestMessageFromConversations(id, userRef)) || {};

          const rec = await fetchRecipients(id);
          const recipient = rec?.[0] ?? {};

          return {
            id: message?.id,
            profileImage: recipient?.photo_uri || "",
            name: `${recipient.first_name ?? "Unknown"} ${
              recipient.last_name ?? ""
            }`,
            country: recipient.country ?? "Unknown",
            lastMessage: message.content || "",
            lastMessageDate: message.created_at || "",
            status: message.status || "",
            conversationsId: id || "",
            isRecipient: message?.sent_by?.id !== uid,
            unread: message?.unread || false,
          };
        })
      );

      fetchedConversations.sort((a, b) => {
        const dateA =
          a.lastMessageDate?.toDate?.() ||
          a.lastMessageDate ||
          new Date(0);

        const dateB =
          b.lastMessageDate?.toDate?.() ||
          b.lastMessageDate ||
          new Date(0);

        return dateB - dateA;
      });

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

      if (!user) {
        setIsLoading(false);
        return;
      }

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
  }, [user]);

  return (
    <PageBackground className="bg-gray-100 h-screen flex flex-col overflow-hidden">
      <PageContainer
        width="compactXS"
        padding="none"
        center={false}
        className="min-h-[100dvh] flex flex-col bg-white rounded-2xl shadow-lg overflow-hidden"
      >
        {isLoading ? (
          <InboxSkeleton />
        ) : (
          <>
            <div className="shrink-0 border-b">
              <ProfileHeader
                userName={userName}
                country={country}
                profileImage={profileImage}
                id={userId}
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
  );
}