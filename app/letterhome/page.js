"use client";
import { useState, useEffect } from "react";
import { db, auth } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import  NavBar from "../../components/bottom-nav-bar";
import { useRouter } from "next/navigation";
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
import { logError } from "../utils/analytics";
import { usePageAnalytics } from "../useAnalytics";

export default function Home() {
  const [userName, setUserName] = useState("");
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [userId, setUserId] = useState("");
  const [inactivityWarning, setInactivityWarning] = useState(false);
  const [inactivitySecondsLeft, setInactivitySecondsLeft] = useState(0);
  const router = useRouter();

  function startInactivityWatcher(timeoutMinutes = 20, warningSeconds = 30) {
    if (typeof window === "undefined") return; // server-side safety

    const INACTIVITY_LIMIT = timeoutMinutes * 60 * 1000;
    let timer;
    let countdownInterval;
    let isInWarning = false;

    const activityEvents = [
      "mousemove",
      "keydown",
      "click",
      "scroll",
      "touchstart",
    ];

    function clearStoredData() {
      localStorage.removeItem("child");
      router.push("/choose-profile");
      console.log("Removed 'child' from localStorage due to inactivity");
    }

    function cleanupTimers() {
      if (timer) clearTimeout(timer);
      if (countdownInterval) clearInterval(countdownInterval);
      timer = undefined;
      countdownInterval = undefined;
    }

    function proceedLogout() {
      cleanupTimers();
      activityEvents.forEach((event) =>
        window.removeEventListener(event, resetTimer)
      );
      setInactivityWarning(false);
      setInactivitySecondsLeft(0);
      clearStoredData();
    }

    function resetTimer() {
      // If the warning UI is showing, treat activity as "still there".
      if (isInWarning) {
        isInWarning = false;
        setInactivityWarning(false);
        setInactivitySecondsLeft(0);
        if (countdownInterval) clearInterval(countdownInterval);
        countdownInterval = undefined;
      }

      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        isInWarning = true;
        setInactivityWarning(true);

        let remaining = warningSeconds;
        setInactivitySecondsLeft(remaining);

        countdownInterval = setInterval(() => {
          remaining -= 1;
          setInactivitySecondsLeft(remaining);

          if (remaining <= 0) {
            clearInterval(countdownInterval);
            countdownInterval = undefined;
            proceedLogout();
          }
        }, 1000);
      }, INACTIVITY_LIMIT);
    };

    activityEvents.forEach((event) =>
      window.addEventListener(event, resetTimer)
    );

    // Start timer immediately
    resetTimer();

    return function stopWatcher() {
      cleanupTimers();
      isInWarning = false;
      setInactivityWarning(false);
      setInactivitySecondsLeft(0);
      activityEvents.forEach((event) =>
        window.removeEventListener(event, resetTimer)
      );
    };
  }

  usePageAnalytics("/letterhome");

  useEffect(() => {
    const stopWatcher = startInactivityWatcher(20, 30);
    return () => {
      if (typeof stopWatcher === "function") stopWatcher();
    };
  }, [router]);

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

  const getConversations = async (uid, avatarUrl) => {
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
              profileImage: avatarUrl || profileImage || "",
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
        throw new Error("No letterboxes found.");
      }
    } catch (err) {
      logError(err, {
        description: "Error fetching data:",
      });
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
          setUserId(uid)

          const userData = await getUserData(uid);
          setUserName(userData.first_name || "Unknown User");
          const downloaded = await getUserPfp(uid);
          const avatarUrl = downloaded || "";
          setProfileImage(avatarUrl);

          const userConversations = await getConversations(uid, avatarUrl);
          setConversations(userConversations);
        } catch (err) {
          logError(err, {
            description: "Error fetching conversations",
          });
          setError("Failed to load data.");
          throw err;
        } finally {
          setIsLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, [router]);

return (
  <>
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
          {/* ===== HEADER (FIXED) ===== */}
          <div className="shrink-0 border-b">
            <ProfileHeader
              userName={userName}
              profileImage={profileImage}
              id={userId}
              showCountry={false}
            />
          </div>

          {/* ===== SCROLLABLE LIST (ONLY SCROLLER) ===== */}
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

          {/* ===== NAVBAR (FIXED) ===== */}
          <div className="shrink-0 border-t bg-blue-100 rounded-b-2xl">
            <NavBar />
          </div>
          </>
        )}
      </PageContainer>

      {inactivityWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg p-5 w-[90%] max-w-sm text-center space-y-3">
            <p className="font-semibold text-gray-900">Are you still there?</p>
            <p className="text-sm text-gray-600">
              Logging out in{" "}
              <span className="font-semibold text-gray-900">
                {inactivitySecondsLeft}s
              </span>
              .
            </p>
            <button
              type="button"
              onClick={() => {
                // Confirm response: trigger activity so the watcher resets the timer.
                window.dispatchEvent(new Event("mousemove"));
              }}
              className="w-full rounded-full bg-primary hover:bg-primary-light text-white py-3 font-bold"
            >
              I&apos;m still here
            </button>
          </div>
        </div>
      )}
    </PageBackground>
  </>
);
}