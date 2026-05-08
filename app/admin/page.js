"use client";

import { useState, useEffect } from "react";
import { db, auth } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import BottomNavBar from "../../components/bottom-nav-bar";
import SuccessModal from "../../components/general/admin/SuccessModal";
import {
  collectionGroup,
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  updateDoc,
  where,
} from "firebase/firestore";

import { storage } from "../firebaseConfig.js";
import { ref as storageRef, getDownloadURL } from "@firebase/storage";

import { PageBackground } from "../../components/general/PageBackground";
import { PageContainer } from "../../components/general/PageContainer";
import ConversationList from "../../components/general/ConversationList";
import Header from "../../components/general/Header";
import AdminFilter from "../../components/general/admin/AdminFilter";
import AdminLetterReview from "../../components/general/admin/AdminLetterReview";
import AdminRejectModal from "../../components/general/admin/AdminRejectModal";
import Button from "../../components/general/Button";
import LetterHomeSkeleton from "../../components/loading/LetterHomeSkeleton";
import { dateToTimestamp } from "../utils/dateHelpers";
import { useDormantLetterbox } from "../../contexts/DormantLetterboxContext";

export default function Admin() {
  const PAGE_SIZE = 5;
  const { handleDormantLetterboxWorker } = useDormantLetterbox();

  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState("");
  const [userType, setUserType] = useState("");
  const [country, setCountry] = useState("");
  const [letters, setLetters] = useState([]);
  const [profileImage, setProfileImage] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const [documents, setDocuments] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  const [selectedStatus, setSelectedStatus] = useState("pending_review");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const [activeFilter, setActiveFilter] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState(null);
  const [activeView, setActiveView] = useState("inbox");
  const [reviewAction, setReviewAction] = useState(null);

  const router = useRouter();

  const updateLocalLetter = (id, updates) => {
    setDocuments((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...updates } : l))
    );
  };

  const currentLetter =
    (selectedLetter && documents.find((d) => d.id === selectedLetter.id)) ||
    selectedLetter;

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

      handleDormantLetterboxWorker();
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [router, handleDormantLetterboxWorker]);

  useEffect(() => {
    if (activeView !== "inbox") return;

    const load = async () => {
      setIsLoading(true);
      setDocuments([]);
      setLastDoc(null);
      setHasMore(true);
      await fetchLetters();
      setIsLoading(false);
    };

    load();
  }, [selectedStatus, startDate, endDate, activeView]);

  const fetchLetters = async (nextPage = false) => {
    const constraints = [
      where("status", "==", selectedStatus),
      orderBy("created_at", "desc"),
      limit(PAGE_SIZE),
    ];

    if (nextPage && lastDoc) constraints.push(startAfter(lastDoc));

    if (startDate) {
      constraints.push(where("created_at", ">=", dateToTimestamp(startDate)));
    }

    if (endDate) {
      constraints.push(where("created_at", "<=", dateToTimestamp(endDate)));
    }

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
    setHasMore(snap.docs.length === PAGE_SIZE);
    setIsLoadingMore(false);
  };

  const filter = (status, start, end) => {
    setSelectedStatus(status);
    setStartDate(start);
    setEndDate(end);
    setActiveFilter(false);
  };

  const clearFilters = () => {
    setSelectedStatus("pending_review");
    setStartDate(null);
    setEndDate(null);
    setActiveFilter(false);
  };

  const revertToPending = async (letter) => {
    if (!letter) return;

    try {
      const ref = doc(db, "letterbox", letter.letterboxId, "letters", letter.id);

      await updateDoc(ref, {
        status: "pending_review",
        moderator_id: deleteField(),
        rejection_reason: deleteField(),
        rejection_feedback: deleteField(),
        updated_at: deleteField(),
      });

      updateLocalLetter(letter.id, {
        status: "pending_review",
        moderator_id: undefined,
        rejection_reason: undefined,
        rejection_feedback: undefined,
        updated_at: undefined,
      });
    } catch (err) {
      console.warn("Revert blocked by Firestore rules", err);
    }

    setReviewAction(null);
    setSelectedLetter(null);
    setActiveView("inbox");
  };

  if (isLoading) return <LetterHomeSkeleton />;

  return (
    <PageBackground className="bg-gray-100 h-screen flex flex-col">
      <div className="flex-1 min-h-0 flex justify-center">
        <PageContainer
          width="compactXS"
          padding="none"
          center={false}
          className="min-h-[100dvh] flex flex-col bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          <div>
            {activeView === "inbox" && (
              <Header
                activeFilter={activeFilter}
                setActiveFilter={setActiveFilter}
                title="Select message types"
                status={selectedStatus}
                isLoadingMore={isLoadingMore}
              />
            )}
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 pt-3 pb-4">
            {activeFilter ? (
              <AdminFilter
                filter={filter}
                clearFilters={clearFilters}
                status={selectedStatus}
                setStatus={setSelectedStatus}
                start={startDate}
                setStart={setStartDate}
                end={endDate}
                setEnd={setEndDate}
              />
            ) : (
              <>
                {activeView === "inbox" && (
                  <div className="flex flex-col flex-1 min-h-0">
                    <main className="overflow-y-auto pt-2">
                      <ConversationList
                        conversations={documents}
                        isAdmin
                        onSelectConversation={(c) => {
                          setSelectedLetter(c);
                          setActiveView("review");
                        }}
                      />
                    </main>

                    {hasMore && (
                      <div className="flex justify-center pt-2 pb-4">
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

                {activeView === "review" && selectedLetter && !reviewAction && (
                  <AdminLetterReview
                    letter={currentLetter}
                    onClose={() => {
                      setReviewAction(null);
                      setActiveView("inbox");
                      setSelectedLetter(null);
                    }}
                    onApprove={async () => {
                      if (!currentLetter) return;

                      const { id, letterboxId } = currentLetter;
                      const previousStatus = currentLetter.status;
                      const previousModeratorId = currentLetter.moderator_id;

                      updateLocalLetter(id, {
                        status: "sent",
                        moderator_id: userId,
                      });

                      try {
                        const ref = doc(
                          db,
                          "letterbox",
                          letterboxId,
                          "letters",
                          id
                        );

                        await updateDoc(ref, {
                          status: "sent",
                          moderator_id: userId,
                          updated_at: serverTimestamp(),
                        });

                        setReviewAction("sent");
                      } catch (err) {
                        console.warn("Approve blocked", err);

                        updateLocalLetter(id, {
                          status: previousStatus,
                          moderator_id: previousModeratorId,
                        });

                        setError(
                          "Approve failed. Please check your permissions and try again."
                        );
                      }
                    }}
                    onReject={() => setActiveView("reject")}
                    onRevert={revertToPending}
                  />
                )}

                {activeView === "reject" && selectedLetter && !reviewAction && (
                  <AdminRejectModal
                    letter={selectedLetter}
                    onClose={() => setActiveView("review")}
                    onSubmit={async (reason, feedback) => {
                      if (!selectedLetter?.letterboxId || !selectedLetter?.id) {
                        setError(
                          "Could not reject this letter. Please refresh and try again."
                        );
                        throw new Error("Missing letter reference for rejection.");
                      }

                      try {
                        const ref = doc(
                          db,
                          "letterbox",
                          selectedLetter.letterboxId,
                          "letters",
                          selectedLetter.id
                        );

                        await updateDoc(ref, {
                          status: "rejected",
                          moderator_id: userId,
                          rejection_reason: reason,
                          rejection_feedback: feedback,
                          updated_at: serverTimestamp(),
                        });

                        updateLocalLetter(selectedLetter.id, {
                          status: "rejected",
                          moderator_id: userId,
                          rejection_reason: reason,
                          rejection_feedback: feedback,
                        });

                        setReviewAction("rejected");
                      } catch (err) {
                        console.warn("Reject blocked by Firestore rules", err);
                        setError(
                          "Reject failed. Please check your permissions and try again."
                        );
                        throw err;
                      }
                    }}
                  />
                )}

                {reviewAction === "sent" && (
                  <SuccessModal
                    type="sent"
                    onClose={() => {
                      setReviewAction(null);
                      setSelectedLetter(null);
                      setActiveView("inbox");
                    }}
                    onRevert={() => revertToPending(selectedLetter)}
                  />
                )}

                {reviewAction === "rejected" && (
                  <SuccessModal
                    type="rejected"
                    onClose={() => {
                      setReviewAction(null);
                      setSelectedLetter(null);
                      setActiveView("inbox");
                    }}
                    onRevert={() => revertToPending(selectedLetter)}
                  />
                )}
              </>
            )}
          </div>

          <div className="shrink-0 border-t bg-blue-100 rounded-b-2xl">
            <BottomNavBar />
          </div>
        </PageContainer>
      </div>
    </PageBackground>
  );
}