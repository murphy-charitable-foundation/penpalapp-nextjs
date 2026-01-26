"use client";

import { useState, useEffect } from "react";
import { db, auth } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import BottomNavBar from "../../components/bottom-nav-bar";
import { updateDoc } from "firebase/firestore";

import {
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  limit,
  startAfter,
  orderBy,
} from "firebase/firestore";

import { storage } from "../firebaseConfig.js";
import { ref as storageRef, getDownloadURL } from "@firebase/storage";

import { PageBackground } from "../../components/general/PageBackground";
import { PageContainer } from "../../components/general/PageContainer";
import WelcomeToast from "../../components/general/WelcomeToast";
import ConversationList from "../../components/general/ConversationList";
import Header from "../../components/general/Header";
import AdminFilter from "../../components/general/admin/AdminFilter";
import AdminLetterReview from "../../components/general/admin/AdminLetterReview";
import AdminRejectModal from "../../components/general/admin/AdminRejectModal";
import Button from "../../components/general/Button";
import LetterHomeSkeleton from "../../components/loading/LetterHomeSkeleton";
import { dateToTimestamp } from "../utils/dateHelpers";
import { useDormantLetterbox } from "../../context/DormantLetterboxContext";

export default function Admin() {
  const { isDormantLetterboxLoading, handleDormantLetterboxWorker } =
    useDormantLetterbox();

  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState("");
  const [userType, setUserType] = useState("");
  const [country, setCountry] = useState("");
  const [letters, setLetters] = useState([]); // intentionally kept
  const [profileImage, setProfileImage] = useState(""); // intentionally kept

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const [documents, setDocuments] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  const [selectedStatus, setSelectedStatus] = useState("pending_review");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const [showWelcome, setShowWelcome] = useState(false);
  const [activeFilter, setActiveFilter] = useState(false);

  const [selectedLetter, setSelectedLetter] = useState(null);
  const [showReview, setShowReview] = useState(false);
  const [showReject, setShowReject] = useState(false);

  const router = useRouter();

  useEffect(() => {
    if (!isDormantLetterboxLoading) {
      handleDormantLetterboxWorker();
    }
  }, [isDormantLetterboxLoading]);

  useEffect(() => {
  if (showReject) {
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "";
  }

  return () => {
    document.body.style.overflow = "";
  };
}, [showReject]);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsLoading(true);

      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.uid);

      const userRef = doc(collection(db, "users"), user.uid);
      const snap = await getDoc(userRef);

      if (!snap.exists() || snap.data()?.user_type !== "admin") {
        router.push("/login");
        return;
      }

      const data = snap.data();
      setUserType(data.user_type);
      setCountry(data.country);
      setUserName(`${data.first_name} ${data.last_name}`);

      try {
        const imgRef = storageRef(
          storage,
          `profile/${user.uid}/profile-image`
        );
        setProfileImage(await getDownloadURL(imgRef));
      } catch {
        setProfileImage("/usericon.png");
      }

      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setDocuments([]);
      setLastDoc(null);
      setHasMore(true);
      await fetchLetters();
      setIsLoading(false);
    };
    load();
  }, [selectedStatus, startDate, endDate]);

  const fetchLetters = async (nextPage = false) => {
    const constraints = [
      where("status", "==", selectedStatus),
      orderBy("created_at", "desc"),
      limit(5),
    ];

    if (nextPage && lastDoc) constraints.push(startAfter(lastDoc));
    if (startDate)
      constraints.push(where("created_at", ">=", dateToTimestamp(startDate)));
    if (endDate)
      constraints.push(where("created_at", "<=", dateToTimestamp(endDate)));

    const q = query(collectionGroup(db, "letters"), ...constraints);
    const snap = await getDocs(q);

    if (snap.empty) {
      setHasMore(false);
      setIsLoadingMore(false);
      return;
    }

    const newDocs = await Promise.all(
      snap.docs.map(async (d) => {
        const data = d.data();
        let pfp = "/usericon.png";

        try {
          if (data.sent_by) {
            const imgRef = storageRef(
              storage,
              `profile/${data.sent_by.id}/profile-image`
            );
            pfp = await getDownloadURL(imgRef);
          }
        } catch {}

        return {
          id: d.id,
          letterboxId: d.ref.parent.parent?.id,
          ...data,
          profileImage: pfp,
          name: data?.name || "",
          lastMessage: data.content,
          lastMessageDate: data.created_at,
        };
      })
    );

    setDocuments((prev) => [...prev, ...newDocs]);
    setLastDoc(snap.docs[snap.docs.length - 1]);
    setIsLoadingMore(false);
  };

  const filter = (status, start, end) => {
    setSelectedStatus(status);
    setStartDate(start);
    setEndDate(end);
    setActiveFilter(false);
  };

  if (isLoading) return <LetterHomeSkeleton />;

  const revertToPending = async (letter) => {
    if (!letter) return;

    try {
      const ref = doc(
        db,
        "letterboxes",
        letter.letterboxId,
        "letters",
        letter.id
      );
      await updateDoc(ref, {
        status: "pending_review",
        moderator_id: null,
        rejection_reason: null,
        rejection_feedback: null,
        updated_at: null,
      });
    } catch (err) {
      console.warn("Revert blocked by Firestore rules", err);
    }

    setSelectedLetter(null);
  };

  return (
    <PageBackground>
      <PageContainer
        maxWidth="lg"
        className="px-6 pt-6 pb-24 space-y-0"
      >
        {!showReview && (
          <Header
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            title="Select message types"
            status={selectedStatus}
            isLoadingMore={isLoadingMore}
          />
        )}

        <WelcomeToast
          userName={userName}
          isVisible={showWelcome}
          onClose={() => setShowWelcome(false)}
        />

        {activeFilter ? (
          <AdminFilter
            filter={filter}
            status={selectedStatus}
            setStatus={setSelectedStatus}
            start={startDate}
            setStart={setStartDate}
            end={endDate}
            setEnd={setEndDate}
          />
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl flex flex-col h-[75vh]">
            {!showReview && (
              <div className="px-6 py-3 text-sm text-gray-500">
                Showing {documents.length}{" "}
                {selectedStatus.replace("_", " ")} letters
              </div>
            )}

            <div className="flex-1 min-h-0">
              {showReview && selectedLetter ? (
                <AdminLetterReview
                  letter={selectedLetter}
                  onClose={() => {
                    setShowReview(false);
                    setSelectedLetter(null);
                  }}
                  onApprove={async () => {
                    try {
                      const ref = doc(
                        db,
                        "letterboxes",
                        selectedLetter.letterboxId,
                        "letters",
                        selectedLetter.id
                      );
                      await updateDoc(ref, {
                        status: "approved",
                        moderator_id: userId,
                        updated_at: new Date(),
                      });
                    } catch (err) {
                      console.warn("Approve blocked by Firestore rules", err);
                    }

                    setSelectedStatus("approved");
                    setShowReview(false);
                    setSelectedLetter(null);
                  }}
                  onReject={() => { setShowReject(true); setShowReview(false); }}
                  onRevert={revertToPending}
                />
              ) : (
                <main className="overflow-y-auto p-6">
                  <ConversationList
                    conversations={documents}
                    isAdmin
                    onSelectConversation={(c) => {
                      setSelectedLetter(c);
                      setShowReview(true);
                    }}
                  />
                </main>
              )}
            </div>

            {!showReview && hasMore && (
              <div className="flex justify-center py-4">
                {isLoadingMore ? (
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Button
                    btnText="Load More"
                    color="blue"
                    rounded="rounded-md"
                    onClick={() => {
                      setIsLoadingMore(true);
                      fetchLetters(true);
                    }}
                  />
                )}
              </div>
            )}
          </div>
        )}

        {showReject && selectedLetter && (
          <AdminRejectModal
            letter={selectedLetter}
            onClose={() => setShowReject(false)}
            onSubmit={async (reason, feedback) => {
              try {
                const ref = doc(
                  db,
                  "letterboxes",
                  selectedLetter.letterboxId,
                  "letters",
                  selectedLetter.id
                );
                await updateDoc(ref, {
                  status: "rejected",
                  moderator_id: userId,
                  rejection_reason: reason,
                  rejection_feedback: feedback,
                  updated_at: new Date(),
                });
              } catch (err) {
                console.warn("Reject blocked by Firestore rules", err);
              }

              setShowReject(false);
              setShowReview(false);
              setSelectedLetter(null);
            }}
          />
        )}

        <BottomNavBar />
      </PageContainer>
    </PageBackground>
  );
}
