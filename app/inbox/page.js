"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import Link from "next/link";
import { db, auth } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { storage } from "../firebaseConfig.js";
import NavBar from "../../components/bottom-nav-bar";
import { useRouter } from "next/navigation";
import ConversationList from "../../components/general/ConversationList";
import {
  getUserPfp,
  fetchLatestMessageFromConversations,
  fetchConversations,
  fetchRecipients,
} from "../utils/conversationsFunctions";

import { deadChat, iterateConversations } from "../utils/deadChat";
import ProfileImage from "/components/general/ProfileImage";
import InboxSkeleton from "../../components/loading/InboxSkeleton";
import Button from "../../components/general/Button";
import ProfileHeader from "../../components/general/message/ProfileHeader";
import MessageCard from "../../components/general/message/MessageCard";
import EmptyState from "../../components/general/inbox/EmptyState";
import { BackButton } from "../../components/general/BackButton";
import { PageContainer } from "../../components/general/PageContainer";
import { PageBackground } from "../../components/general/PageBackground";
import { logButtonEvent, logError } from "../utils/analytics";
import { usePageAnalytics } from "../useAnalytics";

export default function Home() {
  const [userName, setUserName] = useState("");
  const [userType, setUserType] = useState("");
  const [country, setCountry] = useState("");
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [showWelcome, setShowWelcome] = useState(false);
  const [userId, setUserId] = useState("");
  const router = useRouter();

  usePageAnalytics("/inbox");

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

  console.log("got UserData")

  const getConversations = async (uid) => {
    try {
      const conversations = await fetchConversations(uid);
      console.log("my list of conversations: .....", conversations);
      
      if (conversations && conversations.length > 0) {
        const conversationsIds = conversations.map((l) => l.id);

        const fetchedConversations = await Promise.all(
          conversationsIds.map(async (id) => {
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
        return fetchedConversations;
      } else {
        // no conversations is not an exceptional situation – return empty array
        return [];
      }
    } catch (err) {
      logError(err, {
        description: "Error fetching data:",
      });
      setError("Failed to load data.");
      throw err;
    }
  };

   console.log("got conversations")

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        // TODO: redirect if everything is loaded and still no user
        setError("No user logged in.");
        router.push("/login");
        return;
      } else {
        try {
          const uid = user.uid;

          const userData = await getUserData(uid);
          setUserName(userData.first_name || "Unknown User");
          setCountry(userData.country || "Unknown Country");
          setUserType(userData.user_type || "Unknown Type");
          const downloaded = await getUserPfp(uid);
          setProfileImage(downloaded || "");

          const userConversations = await getConversations(uid);
          setConversations(userConversations);
        } catch (err) {
          setError("Error fetching user data or conversations.");
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (auth.currentUser) {
        try {
          const uid = auth.currentUser.uid;
          setUserId(uid);

          const docRef = doc(db, "users", uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const userData = docSnap.data();
            setUserName(userData.first_name || "Unknown User");
            setCountry(userData.country || "Unknown Country");
            setUserType(userData.user_type || "Unknown Type");
            const downloaded = await getUserPfp(uid);
            setProfileImage(downloaded || "");

            // Show welcome message
            setShowWelcome(true);

            // Hide welcome message after 5 seconds
            setTimeout(() => {
              setShowWelcome(false);
            }, 5000);
          } else {
            console.log("No such document!");
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setError("Failed to load user data");
        }
      }
    };

    fetchUserData();
  }, []);

  // useEffect(() => {
  //   const fetchUserData = async () => {
  //   setIsLoading(true);
  //     try {
  //       const uid = user.uid;

  //       const userData = await getUserData(uid);
  //       setUserName(userData.first_name || "Unknown User");
  //       setCountry(userData.country || "Unknown Country");
  //       setUserType(userData.user_type || "Unknown Type");
  //       setProfileImage(userData?.photo_uri || "");

  //       const userConversations = await getConversations(uid);
  //       setConversations(userConversations);
  //     } catch (err) {
  //       setError("Error fetching user data or conversations.");
  //       console.error(err);
  //     } finally {
  //       setIsLoading(false);
  //     }
  // };

  //   fetchUserData();
  // }, []);

  return (
    <PageBackground>
      <PageContainer maxWidth="lg">
        <>
          {isLoading ? (
            <InboxSkeleton />
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
                          description="Many friends are coming hang tight!"
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
                      "/inbox"
                    );
                    iterateConversations();
                  }}
                />
              )}
            </>
          )}
        </>
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
