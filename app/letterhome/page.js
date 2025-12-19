"use client";

import { useLayoutEffect, useRef, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { db, auth } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import NavBar from "../../components/bottom-nav-bar";
import ConversationList from "../../components/general/ConversationList";
import LetterHomeSkeleton from "../../components/loading/LetterHomeSkeleton";
import ProfileHeader from "../../components/general/letter/ProfileHeader";
import EmptyState from "../../components/general/letterhome/EmptyState";
import { PageContainer } from "../../components/general/PageContainer";
import { PageBackground } from "../../components/general/PageBackground";

import {
  getUserPfp,
  fetchLatestLetterFromLetterbox,
  fetchLetterboxes,
  fetchRecipients,
} from "../utils/letterboxFunctions";

import { logError } from "../utils/analytics";
import { usePageAnalytics } from "../useAnalytics";

export default function Home() {
  const [userName, setUserName] = useState("");
  const [userType, setUserType] = useState("");
  const [country, setCountry] = useState("");
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [userId, setUserId] = useState("");

  const router = useRouter();
  usePageAnalytics("/letterhome");

  const TOP_GAP = 6;
  const GAP_BELOW = 2;

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

  const getUserData = async (uid) => {
    const snap = await getDoc(doc(db, "users", uid));
    if (!snap.exists()) throw new Error("No user document found");
    return snap.data();
  };

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
            letterboxId: id || "",
            isRecipient: letter?.sent_by?.id !== uid,
            unread: letter?.unread || false,
          };
        })
      );

      return fetchedConversations;
    } catch (err) {
      logError(err, { description: "Error fetching conversations" });
      setError("Failed to load conversations.");
      return [];
    }
  };

  useEffect(() => {
    setIsLoading(true);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      try {
        const uid = user.uid;
        setUserId(uid);

        const userData = await getUserData(uid);
        setUserName(userData.first_name || "Unknown User");
        setCountry(userData.country || "Unknown Country");
        setUserType(userData.user_type || "Unknown Type");

        const downloaded = await getUserPfp(uid);
        setProfileImage(downloaded || "");

        const userConversations = await getConversations(uid);
        setConversations(userConversations);
      } catch (err) {
        setError("Error fetching data.");
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  return (
    <PageBackground className="bg-gray-100 min-h-[103dvh] overflow-hidden flex flex-col">
      <div className="flex-1 min-h-0" style={{ paddingTop: TOP_GAP }}>
        <div
          className="relative mx-auto w-full max-w-[29rem] rounded-2xl shadow-lg overflow-hidden flex flex-col min-h-0"
          style={{
            height: `calc(103dvh - ${TOP_GAP}px - ${GAP_BELOW}px - env(safe-area-inset-bottom,0px))`,
          }}
        >
          <PageContainer
            width="compactXS"
            padding="none"
            bg="bg-white"
            scroll={false}
            viewportOffset={0}
            className="flex-1 min-h-0 flex flex-col overflow-hidden"
          >
            <ProfileHeader
              userName={userName}
              country={country}
              profileImage={profileImage}
              id={userId}
              className="px-2 m-0 rounded-t-2xl"
            />

            <div
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain"
              style={{
                paddingBottom: `calc(${navH}px + ${GAP_BELOW}px + env(safe-area-inset-bottom,0px))`,
              }}
            >
              <main>
                {isLoading ? (
                  <div className="px-4 py-2">
                    <LetterHomeSkeleton />
                  </div>
                ) : conversations.length > 0 ? (
                  <section className="pb-5">
                    <ConversationList conversations={conversations} />
                  </section>
                ) : (
                  <section className="mt-6 px-6">
                    <EmptyState
                      title="New friends are coming!"
                      description="Many friends are coming — hang tight!"
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
