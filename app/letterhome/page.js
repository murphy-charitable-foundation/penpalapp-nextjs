"use client";

import { useState, useEffect } from "react";
import { db } from "../firebaseConfig";
import { useUser } from "../../contexts/UserContext";
import { useRouter } from "next/navigation";
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
import { logError } from "../utils/analytics";
import { usePageAnalytics } from "../useAnalytics";

export default function Home() {
  const [userName, setUserName] = useState("");
  const [userType, setUserType] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [, setError] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [userId, setUserId] = useState("");
  const [inactivityWarning, setInactivityWarning] = useState(false);
  const [inactivitySecondsLeft, setInactivitySecondsLeft] = useState(0);
  const router = useRouter();
  const { user, userDocRef } = useUser();
  
  usePageAnalytics("/letterhome");

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