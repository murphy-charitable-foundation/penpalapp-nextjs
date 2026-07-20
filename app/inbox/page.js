"use client";

import { useState, useEffect, useCallback } from "react";
import { db } from "../firebaseConfig";
import { useUser } from "../../contexts/UserContext";
import { doc, getDoc } from "firebase/firestore";

import NavBar from "../../components/bottom-nav-bar";
import ConversationList from "../../components/general/ConversationList";
import {
  fetchLatestMessageFromConversation,
  fetchConversations,
  fetchRecipients,
} from "../utils/conversationsFunctions";
import { getUserPfp } from "../utils/avatarUtils";

import InboxSkeleton from "../../components/loading/InboxSkeleton";
import ProfileHeader from "../../components/general/message/ProfileHeader";
import EmptyState from "../../components/general/inbox/EmptyState";
import { PageContainer } from "../../components/general/PageContainer";
import { PageBackground } from "../../components/general/PageBackground";
import { logError } from "../utils/analytics";
import { usePageAnalytics } from "../useAnalytics";

const toDateValue = (date) => date?.toDate?.() || date || new Date(0);

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

  const getConversations = useCallback(async (uid) => {
    try {
      const conversations = await fetchConversations();

      if (!conversations || conversations.length === 0) {
        return [];
      }

      const conversationIds = conversations.map((conversation) => conversation.id);
      
      const userRef = doc(db, "users", uid);
      const fetchedConversations = await Promise.all(
        conversationIds.map(async (id) => {
          const message =
            (await fetchLatestMessageFromConversation(id, userRef)) || {};

          const attachments = Array.isArray(message.attachments)
            ? message.attachments
            : [];

          const legacyAttachmentType =
            attachments.length === 0 && message.media_url ? message.media_type : null;

          const attachmentTypes =
            attachments.length > 0
              ? attachments.map((attachment) => attachment.media_type || attachment.mediaType || "file")
              : legacyAttachmentType
              ? [legacyAttachmentType]
              : [];

          const attachmentCount =
            attachments.length > 0 ? attachments.length : legacyAttachmentType ? 1 : 0;

          const rec = await fetchRecipients(id);
          const recipient = rec?.[0] ?? {};

          return {
            id: message?.id || id,
            profileImage: recipient?.pfp || "",
            name: `${recipient.first_name ?? "Unknown"} ${recipient.last_name ?? ""}`.trim(),
            country: recipient.country ?? "Unknown",
            lastMessage: message.content || "",
            attachments: message.attachments || [],
            lastMessageDate: message.lastMessageDate || "",
            status: message.status || "",
            conversationId: id || "",
            isRecipient: message?.sent_by?.id !== uid,
            unread: message?.unread || false,
          };
        })
      );

      return fetchedConversations.sort((a, b) =>
        toDateValue(b.lastMessageDate) - toDateValue(a.lastMessageDate)
      );
    } catch (err) {
      logError(err, {
        description: "Error fetching conversations",
      });

      setError("Failed to load data.");
      throw err;
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      setIsLoading(true);

      try {
        const uid = user.uid;
        setUserId(uid);

        const userData = await getUserData(uid);

        setUserName(userData.first_name || "Unknown User");

        try {
          const downloaded = await getUserPfp(uid);
          setProfileImage(downloaded || "");
        } catch (error) {
          console.error("Failed to load profile image", error);
          setProfileImage("");
        }

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
  }, [user, getConversations]);

  if (isLoading) {
    return <InboxSkeleton />;
  }

  return (
    <>
      <PageBackground className="bg-gray-100 h-screen flex flex-col overflow-hidden">
        <PageContainer
          width="compactXS"
          padding="none"
          center={false}
          className="min-h-[100dvh] flex flex-col bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          <div className="shrink-0 border-b">
            <ProfileHeader
              userName={userName}
              profileImage={profileImage}
              id={userId}
              showCountry={false}
            />
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto px-3 pt-2">
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
        </PageContainer>
      </PageBackground>
    </>
  );
}
