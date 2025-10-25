"use client";

import { useState, useEffect } from "react";

import { doc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { logError, logButtonEvent } from "../utils/analytics";

import { useUser } from "../../contexts/UserContext";


import NavBar from "../../components/bottom-nav-bar";
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
import { PageContainer } from "../../components/general/PageContainer";
import { PageBackground } from "../../components/general/PageBackground";

export default function Home() {
  const { user, userData, userType, profileImage } = useUser();
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  // const [showWelcome, setShowWelcome] = useState(false);
  // const [userId, setUserId] = useState("");
  const router = useRouter();

  // const getUserData = async (uid) => {
  //   const docRef = doc(db, "users", uid);
  //   const docSnap = await getDoc(docRef);

  //   if (docSnap.exists()) {
  //     return docSnap.data();
  //   } else {
  //     setError("User data not found.");
  //     throw new Error("No user document found.");
  //   }
  // };

  const getConversations = async (uid) => {
  try {
    const letterboxes = await fetchLetterboxes();

    if (!letterboxes || letterboxes.length === 0) {
      setError("No conversations found.");
      return [];
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
          letterboxId: id,
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
    setError("Failed to load conversations.");
    return [];
  }
};


  useEffect(() => {
  if (!user) {
    router.push("/login");
    return;
  }

  const loadConversations = async () => {
    setIsLoading(true);
    try {
      const data = await getConversations(user.uid);
      setConversations(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load conversations.");
    } finally {
      setIsLoading(false);
    }
  };

  loadConversations();
}, [user]);


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
   if (isLoading) {
    return <LetterHomeSkeleton />;
  }


  return (
    <PageBackground>
      <PageContainer maxWidth="lg">
          <div className="w-full bg-gray-100 min-h-screen py-24 fixed top-0 left-0 z-[100]">
            <BackButton />
            <div className="max-w-lg mx-auto bg-white shadow-md rounded-lg overflow-hidden">
              <ProfileHeader
                userName={userData?.first_name || "Unknown User"}
                country={userData?.country || "Unknown Country"}
                profileImage={profileImage}
                id={user?.uid || ""}
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
                  "/letterhome"
                );
                iterateLetterBoxes();
              }}
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

