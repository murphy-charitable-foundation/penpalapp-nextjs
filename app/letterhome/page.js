"use client";

import { useLayoutEffect, useRef, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
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
import { PageContainer } from "../../components/general/PageContainer";
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
  }, [user]); // refetch if user changes

  const TOP_GAP = 6;
  const GAP_BELOW = 2;
  const CARD_MAX_W = 640;

  const [navH, setNavH] = useState(88);
  const navWrapRef = useRef(null);

  useLayoutEffect(() => {
    const el = navWrapRef.current;
    if (!el) return;
    const update = () => setNavH(el.offsetHeight || 88);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
      ro.disconnect();
    };
  }, []);

  if (isLoading) {
    return <LetterHomeSkeleton />;
  }
  
  return (
    <PageBackground className="bg-gray-100 min-h-[103dvh] overflow-hidden flex flex-col">
      
      <div className="flex-1 min-h-0" style={{ paddingTop: TOP_GAP }}>
        <div
          className="relative mx-auto w-full rounded-2xl overflow-hidden shadow-lg flex flex-col min-h-0"
          style={{
            maxWidth: `${CARD_MAX_W}px`,
            height: `calc(103dvh - ${navH}px - ${TOP_GAP}px - ${GAP_BELOW}px - env(safe-area-inset-bottom,0px))`,
          }}
        >

          <PageContainer
            padding="none"
            bg="bg-white"
            scroll={false}                 
            viewportOffset={0}
            className="p-0 flex-1 min-h-0 flex flex-col !w-full !max-w-none rounded-2xl"
            style={{ maxWidth: "unset", width: "100%" }}
          > 
            <ProfileHeader
              userName={userData?.first_name || "Unknown User"}
              country={userData?.country || "Unknown Country"}
              profileImage={profileImage}
              id={user?.uid || ""}
              className="px-6 m-0 rounded-t-2xl"
            />
              {/* SINGLE SCROLLER */}
              <div
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain"
              style={{
                paddingBottom: `calc(${navH}px + ${GAP_BELOW}px + env(safe-area-inset-bottom,0px))`,
              }}
            >
                <main className="px-0">
                    {conversations.length > 0 ? (
                      <section className="mt-0 pb-10">
                        <ConversationList conversations={conversations} maxHeight="none" />
                      </section>
                    ) : (
                      <section className="mt-6 px-6">
                        <EmptyState
                          title="New friends are coming!"
                          description="Many friends are coming hang tight!"
                        />
                      </section>
                    )}
                </main>
              </div>
          </PageContainer>
        </div>
      </div>

      <div ref={navWrapRef}>
        <NavBar />
      </div>
    </PageBackground>
  );

}