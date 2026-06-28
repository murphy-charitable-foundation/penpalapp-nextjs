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
import AdminHeader from "../../components/general/admin/AdminHeader";
import AdminFilter from "../../components/general/admin/AdminFilter";
import AdminMessageReview from "../../components/general/admin/AdminMessageReview";
import AdminRejectModal from "../../components/general/admin/AdminRejectModal";
import Button from "../../components/general/Button";
import InboxSkeleton from "../../components/loading/InboxSkeleton";
import { dateToTimestamp } from "../utils/dateHelpers";
import { useDormantConversation } from "../../contexts/DormantConversationContext";

export default function Admin() {
  const PAGE_SIZE = 5;
  const { handleDormantConversationWorker } = useDormantConversation();

  const [userId, setUserId] = useState("");
  const [documents, setDocuments] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isConversationsLoading, setIsConversationsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [selectedStatus, setSelectedStatus] = useState("pending_review");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const [activeFilter, setActiveFilter] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [activeView, setActiveView] = useState("inbox");
  const [reviewAction, setReviewAction] = useState(null);

  const router = useRouter();

  const updateLocalMessage = (id, updates) => {
    setDocuments((prev) =>
      prev.map((message) =>
        message.id === id ? { ...message, ...updates } : message,
      ),
    );
  };

  const currentMessage =
    (selectedMessage && documents.find((d) => d.id === selectedMessage.id)) ||
    selectedMessage;

  const fetchConversations = async (nextPage = false, pageCursor = null) => {
    try {
      setError("");

      const constraints = [
        where("status", "==", selectedStatus),
        orderBy("created_at", "desc"),
        limit(PAGE_SIZE),
      ];

      if (nextPage && pageCursor) {
        constraints.push(startAfter(pageCursor));
      }

      if (startDate) {
        constraints.push(where("created_at", ">=", dateToTimestamp(startDate)));
      }

      if (endDate) {
        constraints.push(where("created_at", "<=", dateToTimestamp(endDate)));
      }

      const q = query(collectionGroup(db, "messages"), ...constraints);
      const snap = await getDocs(q);

      if (snap.empty) {
        setHasMore(false);
        return;
      }

      const newDocs = await Promise.all(
        snap.docs.map(async (d) => {
          const data = d.data();
          const conversationId = d.ref.parent.parent?.id || "";
          let pfp = "/usericon.png";

          try {
            if (data.sent_by?.id) {
              const imgRef = storageRef(
                storage,
                `profile/${data.sent_by.id}/profile-image`,
              );
              pfp = await getDownloadURL(imgRef);
            }
          } catch {
            pfp = "/usericon.png";
          }

          let sender = {};

          try {
            if (data.sent_by?.id) {
              const senderRef = doc(db, "users", data.sent_by.id);
              const senderSnap = await getDoc(senderRef);

              if (senderSnap.exists()) {
                sender = senderSnap.data();
              }
            }
          } catch {
            sender = {};
          }

          return {
            id: d.id,
            conversationId,
            ...data,
            profileImage: pfp,
            name: `${sender.first_name ?? "Unknown"} ${
              sender.last_name ?? ""
            }`.trim(),
            country: sender.country ?? "Unknown",
            lastMessage: data.content,
            lastMessageDate: data.created_at,
          };
        }),
      );

      setDocuments((prev) => (nextPage ? [...prev, ...newDocs] : newDocs));
      setLastDoc(snap.docs[snap.docs.length - 1]);
      setHasMore(snap.docs.length === PAGE_SIZE);
    } catch (err) {
      console.warn("Failed to fetch admin messages", err);
      setError("Failed to load messages. Please try again.");
    } finally {
      setIsConversationsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsAuthLoading(true);

      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.uid);

      try {
        const userRef = doc(collection(db, "users"), user.uid);
        const snap = await getDoc(userRef);

        if (!snap.exists() || snap.data()?.user_type !== "admin") {
          router.push("/login");
          return;
        }

        handleDormantConversationWorker();
      } catch (err) {
        console.warn("Admin auth check failed", err);
        setError("Something went wrong. Please refresh and try again.");
      } finally {
        setIsAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router, handleDormantConversationWorker]);

  useEffect(() => {
    if (activeView !== "inbox") return;
    if (!userId) return;
    if (isAuthLoading) return;

    const loadConversations = async () => {
      setIsConversationsLoading(true);
      setDocuments([]);
      setLastDoc(null);
      setHasMore(true);

      await fetchConversations(false, null);
    };

    loadConversations();
  }, [selectedStatus, startDate, endDate, activeView, userId, isAuthLoading]);

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

  const revertToPending = async (message) => {
    if (!message) return;

    setIsReviewSubmitting(true);

    try {
      const ref = doc(
        db,
        "conversations",
        message.conversationId,
        "messages",
        message.id,
      );

      await updateDoc(ref, {
        status: "pending_review",
        moderator_id: deleteField(),
        rejection_reason: deleteField(),
        rejection_feedback: deleteField(),
      });

      updateLocalMessage(message.id, {
        status: "pending_review",
        moderator_id: undefined,
        rejection_reason: undefined,
        rejection_feedback: undefined,
      });

      setReviewAction(null);
      setSelectedMessage(null);
      setActiveView("inbox");
    } catch (err) {
      console.warn("Revert blocked by Firestore rules", err);
      setError("Revert failed. Please try again.");
    } finally {
      setIsReviewSubmitting(false);
    }
  };

  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    await fetchConversations(true, lastDoc);
  };

  const handleApprove = async () => {
    if (!currentMessage) return;

    setIsReviewSubmitting(true);

    const { id, conversationId } = currentMessage;

    try {
      const ref = doc(db, "conversations", conversationId, "messages", id);

      await updateDoc(ref, {
        status: "approved",
        moderator_id: userId,
        moderated_at: serverTimestamp(),
      });

      updateLocalMessage(id, {
        status: "approved",
        moderator_id: userId,
      });

      setReviewAction("approved");
    } catch (err) {
      console.warn("Approve blocked", err);
      setError("Approve failed. Please check your permissions and try again.");
    } finally {
      setIsReviewSubmitting(false);
    }
  };

  const handleRejectSubmit = async (reason, feedback) => {
    if (!selectedMessage?.conversationId || !selectedMessage?.id) {
      setError("Could not reject this message. Please refresh and try again.");
      throw new Error("Missing message reference for rejection.");
    }

    setIsReviewSubmitting(true);

    try {
      const ref = doc(
        db,
        "conversations",
        selectedMessage.conversationId,
        "messages",
        selectedMessage.id,
      );

      await updateDoc(ref, {
        status: "rejected",
        moderator_id: userId,
        rejection_reason: reason,
        rejection_feedback: feedback,
        moderated_at: serverTimestamp(),
      });

      updateLocalMessage(selectedMessage.id, {
        status: "rejected",
        moderator_id: userId,
        rejection_reason: reason,
        rejection_feedback: feedback,
        moderated_at: serverTimestamp(),
      });

      setReviewAction("rejected");
    } catch (err) {
      console.warn("Reject blocked by Firestore rules", err);
      setError("Reject failed. Please check your permissions and try again.");
      throw err;
    } finally {
      setIsReviewSubmitting(false);
    }
  };

  if (isAuthLoading || isConversationsLoading) {
    return <InboxSkeleton />;
  }

  return (
    <PageBackground className="bg-gray-100 h-screen flex flex-col">
      <div className="flex-1 min-h-0 flex justify-center">
        <PageContainer
          width="compactXS"
          padding="none"
          center={false}
          className="h-[100dvh] flex flex-col bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          {activeView === "inbox" && (
            <AdminHeader
              activeFilter={activeFilter}
              setActiveFilter={setActiveFilter}
              status={selectedStatus}
              isLoadingMore={isLoadingMore}
            />
          )}

          {error && (
            <div className="mx-6 mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex-1 min-h-0 overflow-hidden">
            {activeFilter ? (
              <div className="h-full overflow-y-auto overscroll-contain px-6 pt-3 pb-4">
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
              </div>
            ) : (
              <>
                {activeView === "inbox" && (
                  <div className="h-full flex flex-col min-h-0 px-6 pt-3 pb-4">
                    <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain pt-2">
                      <ConversationList
                        conversations={documents}
                        isAdmin
                        onSelectConversation={(conversation) => {
                          setSelectedMessage(conversation);
                          setActiveView("review");
                        }}
                      />

                      {hasMore && (
                        <div className="flex justify-center pt-4 pb-6">
                          {isLoadingMore ? (
                            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Button
                              btnText="Load More"
                              color="blue"
                              size="sm"
                              rounded="rounded-full"
                              onClick={handleLoadMore}
                            />
                          )}
                        </div>
                      )}
                    </main>
                  </div>
                )}

                {activeView === "review" &&
                  selectedMessage &&
                  !reviewAction && (
                    <div className="h-full overflow-hidden">
                      <AdminMessageReview
                        message={currentMessage}
                        attachments={currentMessage?.attachments || []}
                        isSubmitting={isReviewSubmitting}
                        onClose={() => {
                          if (isReviewSubmitting) return;

                          setReviewAction(null);
                          setActiveView("inbox");
                          setSelectedMessage(null);
                        }}
                        onApprove={handleApprove}
                        onReject={() => {
                          if (isReviewSubmitting) return;
                          setActiveView("reject");
                        }}
                        onRevert={revertToPending}
                      />
                    </div>
                  )}

                {activeView === "reject" &&
                  selectedMessage &&
                  !reviewAction && (
                    <div className="h-full overflow-hidden">
                      <AdminRejectModal
                        message={selectedMessage}
                        onClose={() => setActiveView("review")}
                        onSubmit={handleRejectSubmit}
                      />
                    </div>
                  )}

                {reviewAction === "approved" && (
                  <div className="h-full overflow-hidden">
                    <SuccessModal
                      type="approved"
                      onClose={() => {
                        setReviewAction(null);
                        setSelectedMessage(null);
                        setActiveView("inbox");
                      }}
                      onRevert={() => revertToPending(selectedMessage)}
                    />
                  </div>
                )}

                {reviewAction === "rejected" && (
                  <SuccessModal
                    type="rejected"
                    onClose={() => {
                      setReviewAction(null);
                      setSelectedMessage(null);
                      setActiveView("inbox");
                    }}
                    onRevert={() => revertToPending(selectedMessage)}
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
