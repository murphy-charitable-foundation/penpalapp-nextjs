"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import Link from "next/link";
import { db, auth } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  getDoc
} from "firebase/firestore";

import { storage } from "../firebaseConfig.js";
import NavBar from "../../components/bottom-nav-bar";
import * as Sentry from "@sentry/nextjs";
import { useRouter } from "next/navigation";
import ConversationList from "../../components/general/ConversationList";
import {
  getUserPfp,
  fetchLatestLetterFromLetterbox,
  fetchLetterboxes,
  fetchRecipients,
} from "../utils/letterboxFunctions";

import { deadChat, iterateLetterBoxes } from "../utils/deadChat";
import ProfileImage from "/components/general/ProfileImage";
import LetterHomeSkeleton from "../../components/loading/LetterHomeSkeleton";
import Button from "../../components/general/Button";
import ProfileHeader from "../../components/general/letter/ProfileHeader";
import LetterCard from "../../components/general/letter/LetterCard";
import EmptyState from "../../components/general/letterhome/EmptyState";
import { BackButton } from "../../components/general/BackButton";
import { PageContainer } from "../../components/general/PageContainer";
import { PageBackground } from "../../components/general/PageBackground";

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
              isRecipient: letter?.sent_by?.id !== uid,
              unread: letter?.unread || false,
            };
          })
        );
        return fetchedConversations;
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
        setProfileImage(downloaded|| "");

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
            const downloaded = await getUserPfp(uid)
            setProfileImage(downloaded|| "");
            
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
                  onClick={iterateLetterBoxes}
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
