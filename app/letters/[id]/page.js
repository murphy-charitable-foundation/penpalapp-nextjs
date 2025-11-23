"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { db } from "../../firebaseConfig";
import {
  collection,
  doc,
  getDoc,
  updateDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  fetchLetterbox,
  fetchRecipients,
} from "../../../app/utils/letterboxFunctions";
import { formatTime, isDifferentDay } from "../../../app/utils/dateHelpers";
import ProfileImage from "../../../components/general/ProfileImage";
import { FaExclamationCircle } from "react-icons/fa";
import ReportPopup from "../../../components/general/letter/ReportPopup";
import ConfirmReportPopup from "../../../components/general/letter/ConfirmReportPopup";
import { useRouter } from "next/navigation";
import FirstTimeChatGuide from "../../../components/tooltip/FirstTimeChatGuide";
import { usePathname } from "next/navigation";
import LettersSkeleton from "../../../components/loading/LettersSkeleton";
import Image from "next/image";
import { PageContainer } from "../../../components/general/PageContainer";
import { AlertTriangle } from "lucide-react";
import LoadingSpinner from "../../../components/loading/LoadingSpinner";
import { logButtonEvent, logError } from "../../utils/analytics";
import { usePageAnalytics } from "../../useAnalytics";
import React from "react";

const fetchDraft = async (letterboxId, userRef, shouldCreate = false) => {
  try {
    const letterboxRef = doc(db, "letterbox", letterboxId);
    const lettersRef = collection(letterboxRef, "letters");

    const draftQuery = query(
      lettersRef,
      where("sent_by", "==", userRef),
      where("status", "==", "draft"),
      orderBy("updated_at", "desc"),
      limit(1)
    );

    const draftSnapshot = await getDocs(draftQuery);

    if (!draftSnapshot.empty) {
      const draftDoc = draftSnapshot.docs[0];
      const draftData = {
        id: draftDoc.id,
        ...draftDoc.data(),
        created_at:
          draftDoc.data().created_at?.toDate?.() || draftDoc.data().created_at,
        updated_at:
          draftDoc.data().updated_at?.toDate?.() || draftDoc.data().updated_at,
      };

      return draftData;
    }

    if (shouldCreate) {
      const newDraftData = {
        sent_by: userRef,
        content: "",
        status: "draft",
        created_at: new Date(),
        updated_at: new Date(),
        deleted: null,
        unread: true,
      };

      const newDraftRef = doc(lettersRef);
      await setDoc(newDraftRef, newDraftData);

      return {
        id: newDraftRef.id,
        ...newDraftData,
      };
    }

    return null;
  } catch (error) {
    console.error("❌ fetchDraft error:", error);
    return null;
  }
};

export default function Page({ params }) {
  const { id } = params;

  const auth = getAuth();
  const router = useRouter();
  const messagesEndRef = useRef(null);
  const textAreaRef = useRef(null);

  const [user, setUser] = useState(null);
  const [userRef, setUserRef] = useState(null);
  const [userLocation, setUserLocation] = useState("");
  const [profileImage, setProfileImage] = useState("");

  const [messageContent, setMessageContent] = useState("");
  const messageInputRef = useRef(null);
  const [draft, setDraft] = useState(null);
  const [hasDraftContent, setHasDraftContent] = useState(false);
  const pathname = usePathname();

  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingMessageOriginalContent, setEditingMessageOriginalContent] =
    useState("");

  const [allMessages, setAllMessages] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [recipientName, setRecipientName] = useState("");
  const [lettersRef, setLettersRef] = useState(null);
  const [userType, setUserType] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const [isXButtonDisabled, setIsXButtonDisabled] = useState(false);
  const [isUpdatingFirebase, setIsUpdatingFirebase] = useState(false);

  const [showReportPopup, setShowReportPopup] = useState(false);
  const [showConfirmReportPopup, setShowConfirmReportPopup] = useState(false);
  const [reportContent, setReportContent] = useState(null);
  const [reportSender, setReportSender] = useState(null);

  const [draftTimer, setDraftTimer] = useState(null);

  const scrollToBottom = (instant = false) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: instant ? "auto" : "smooth",
      block: "end",
    });
  };

  const saveDraft = useCallback(
    async (content) => {
      if (!user || !lettersRef || isSending) {
        return Promise.resolve();
      }

      setIsUpdatingFirebase(true);

      try {
        const letterUserRef = userRef || doc(db, "users", user.uid);
        const trimmedContent = content.trim();
        const currentTime = new Date();

        let existingDraft = draft;

        if (!existingDraft?.id) {
          existingDraft = await fetchDraft(id, letterUserRef, false);

          if (existingDraft) {
            setDraft(existingDraft);
          }
        }

        const baseDraftData = {
          sent_by: letterUserRef,
          content: trimmedContent,
          status: "draft",
          updated_at: currentTime,
          deleted: null,
          unread: true,
        };

        if (existingDraft?.id) {
          const draftDocRef = doc(lettersRef, existingDraft.id);

          const updateData = {
            ...baseDraftData,
            created_at: existingDraft.created_at || currentTime,
          };

          await updateDoc(draftDocRef, updateData);

          setDraft({ ...updateData, id: existingDraft.id });
        } else {
          const newDraftData = {
            ...baseDraftData,
            created_at: currentTime,
          };

          const newDraftRef = doc(lettersRef);
          await setDoc(newDraftRef, newDraftData);

          setDraft({ ...newDraftData, id: newDraftRef.id });
        }

        const hasContent = Boolean(trimmedContent);

        setHasDraftContent(hasContent);
        if (!hasContent && isEditing) {
          setIsEditing(false);
        }

        return Promise.resolve();
      } catch (error) {
        console.error("❌ saveDraft error:", error);

        if (error.code === "permission-denied") {
          console.error("🔒 Permission denied error");
          alert("Permission denied. Please check your access rights.");
        } else if (error.code === "not-found") {
          console.error("🔍 Document not found, attempting retry...");
          setDraft(null);
          if (trimmedContent) {
            try {
              const newDraftData = {
                ...baseDraftData,
                created_at: currentTime,
              };
              const newDraftRef = doc(lettersRef);
              await setDoc(newDraftRef, newDraftData);

              setDraft({ ...newDraftData, id: newDraftRef.id });
            } catch (retryError) {
              logError(retryError, {
                description: "Retry Error:",
              });
            }
          }
        }

        return Promise.reject(error);
      } finally {
        setIsUpdatingFirebase(false);
      }
    },
    [user, lettersRef, isSending, draft, userRef, isEditing, id]
  );

  const handleMessageChange = async (e) => {
    const newContent = e.target.value;

    setMessageContent(newContent);
    const trimmedContent = newContent.trim();

    if (draftTimer) {
      clearTimeout(draftTimer);
      setDraftTimer(null);
    }

    if (trimmedContent.length > 0) {
      setIsEditing(true);
      setHasDraftContent(true);

      if (!editingMessageId) {
        const timer = setTimeout(async () => {
          try {
            await saveDraft(newContent);
          } catch (error) {
            logError(error, {
              description: "Failed to auto-save draft:",
            });
          }
        }, 1000);
        setDraftTimer(timer);
      } else {
      }
    } else {
      setHasDraftContent(false);
      setIsEditing(false);

      if (!editingMessageId) {
        setIsXButtonDisabled(true);

        try {
          await saveDraft(newContent);

          setIsXButtonDisabled(false);
        } catch (error) {
          console.error("❌ Failed to save empty draft:", error);
          logError(error, {
            description: "Failed to save empty draft:",
          });
          setTimeout(() => {
            setIsXButtonDisabled(false);
          }, 3000);
        }
      }
    }
  };

  // FIXED: Restore draft after updating message
  const handleUpdateMessage = async () => {
    const trimmedContent = messageContent.trim();

    if (!trimmedContent) {
      alert("Please enter a message");
      return;
    }

    if (isSending || !editingMessageId) {
      return;
    }

    setIsSending(true);

    try {
      if (!user || !lettersRef) {
        throw new Error("Missing required dependencies: user or lettersRef");
      }

      const currentTime = new Date();
      const messageRef = doc(lettersRef, editingMessageId);

      const updateData = {
        content: trimmedContent,
        updated_at: currentTime,
      };

      await updateDoc(messageRef, updateData);

      const letterUserRef = userRef || doc(db, "users", user.uid);
      const existingDraft = await fetchDraft(id, letterUserRef, false);

      if (existingDraft && existingDraft.content?.trim()) {
        setDraft(existingDraft);
        setMessageContent(existingDraft.content);
        setHasDraftContent(true);
        setIsEditing(true);
      } else {
        setMessageContent("");
        setDraft(null);
        setHasDraftContent(false);
        setIsEditing(false);
      }

      setEditingMessageId(null);
      setEditingMessageOriginalContent("");
      setSelectedMessageId(null);

      setAllMessages((prev) => {
        const updatedMessages = prev.map((msg) => {
          if (msg.id === editingMessageId) {
            return {
              ...msg,
              content: trimmedContent,
              updated_at: currentTime,
            };
          }
          return msg;
        });
        return updatedMessages;
      });

      setTimeout(() => {
        scrollToBottom(true);
      }, 100);
    } catch (error) {
      console.error("❌ handleUpdateMessage error:", error);

      if (error.code === "permission-denied") {
        alert(
          "Permission denied. Please check your access rights to this conversation."
        );
      } else if (error.code === "unauthenticated") {
        alert("You are not authenticated. Please log in again.");
      } else {
        alert("Failed to update message. Please try again.");
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleSendMessage = async () => {
    if (editingMessageId) {
      return handleUpdateMessage();
    }

    const trimmedContent = messageContent.trim();

    if (!trimmedContent) {
      alert("Please enter a message");
      return;
    }

    if (isSending) {
      return;
    }

    setIsSending(true);

    try {
      if (!user || !lettersRef) {
        throw new Error("Missing required dependencies: user or lettersRef");
      }

      const letterUserRef = userRef || doc(db, "users", user.uid);
      const currentTime = new Date();

      const messageData = {
        sent_by: letterUserRef,
        content: trimmedContent,
        status: "pending_review",
        created_at: currentTime,
        updated_at: currentTime,
        deleted: null,
        unread: true,
      };

      let messageRef;

      if (draft?.id) {
        messageRef = doc(lettersRef, draft.id);

        const updateData = {
          ...messageData,
          created_at: draft.created_at || currentTime,
        };

        await updateDoc(messageRef, updateData);
      } else {
        messageRef = doc(lettersRef);
        await setDoc(messageRef, messageData);
      }

      setMessageContent("");
      setDraft(null);
      setHasDraftContent(false);
      setIsEditing(false);

      const messageWithId = {
        ...messageData,
        id: messageRef.id,
        sent_by: { id: user.uid },
      };

      setAllMessages((prev) => {
        const newMessages = [...prev, messageWithId];

        return newMessages;
      });

      setTimeout(() => {
        scrollToBottom(true);
      }, 100);
    } catch (error) {
      if (error.code === "permission-denied") {
        alert(
          "Permission denied. Please check your access rights to this conversation."
        );
      } else if (error.code === "unauthenticated") {
        alert("You are not authenticated. Please log in again.");
      } else {
        alert("Failed to send message. Please try again.");
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleCloseMessage = async () => {
    if (isXButtonDisabled || isUpdatingFirebase) {
      return;
    }

    const trimmedMessageContent = messageContent.trim();

    if (editingMessageId) {
      if (trimmedMessageContent !== editingMessageOriginalContent.trim()) {
        setShowCloseDialog(true);
      } else {
        setMessageContent("");
        setEditingMessageId(null);
        setEditingMessageOriginalContent("");
        setIsEditing(false);
        setHasDraftContent(false);
        setSelectedMessageId(null);
        router.back();
      }
      return;
    }

    if (isEditing) {
      try {
        await saveDraft(messageContent);
      } catch (error) {
        logError(error, {
          description: "Failed to save state before close:",
        });
      }
    }

    if (trimmedMessageContent.length > 0) {
      setShowCloseDialog(true);
    } else {
      router.back();
    }
  };

  const handleConfirmClose = async () => {
    setShowCloseDialog(false);

    if (editingMessageId) {
      setMessageContent("");
      setEditingMessageId(null);
      setEditingMessageOriginalContent("");
      setIsEditing(false);
      setHasDraftContent(false);
      setSelectedMessageId(null);
    }

    router.back();
  };

  const handleContinueEditing = () => {
    setShowCloseDialog(false);
    setIsEditing(true);

    setTimeout(() => {
      textAreaRef.current?.focus();
    }, 100);
  };

  const handleReportUserClick = () => {
    if (recipients.length > 0) {
      setReportSender(recipients[0].id);
      setReportContent("General report about user behavior");
      setShowReportPopup(true);
    }
  };

  const loadMessages = async () => {
    if (!user || !id || !recipients.length || !lettersRef) {
      return;
    }

    try {
      const sentQuery = query(
        lettersRef,
        where("status", "==", "sent"),
        orderBy("created_at", "desc"),
        limit(20)
      );

      const myPendingQuery = query(
        lettersRef,
        where("status", "==", "pending_review"),
        where("sent_by", "==", userRef),
        orderBy("created_at", "desc"),
        limit(20)
      );

      const otherUserRefs = recipients
        .filter((r) => r.id !== user.uid)
        .map((r) => doc(db, "users", r.id));

      const queryPromises = [getDocs(sentQuery), getDocs(myPendingQuery)];

      for (const otherUserRef of otherUserRefs) {
        const otherPendingQuery = query(
          lettersRef,
          where("status", "==", "pending_review"),
          where("sent_by", "==", otherUserRef),
          orderBy("created_at", "desc"),
          limit(20)
        );
        queryPromises.push(getDocs(otherPendingQuery));
      }

      const snapshots = await Promise.all(queryPromises);

      const allFetchedMessages = [];

      snapshots.forEach((snapshot, index) => {
        snapshot.docs.forEach((doc) => {
          const messageData = {
            id: doc.id,
            ...doc.data(),
            created_at:
              doc.data().created_at?.toDate?.() || doc.data().created_at,
            updated_at:
              doc.data().updated_at?.toDate?.() || doc.data().updated_at,
          };
          allFetchedMessages.push(messageData);
        });
      });

      const sortedMessages = allFetchedMessages.sort((a, b) => {
        const aTime =
          a.created_at instanceof Date ? a.created_at : new Date(a.created_at);
        const bTime =
          b.created_at instanceof Date ? b.created_at : new Date(b.created_at);
        return aTime.getTime() - bTime.getTime();
      });

      const messagesWithSenderInfo = await Promise.all(
        sortedMessages.map(async (message) => {
          if (message.sent_by?.id !== user.uid) {
            const recipient = recipients.find(
              (r) => r.id === message.sent_by?.id
            );
            if (recipient) {
              message.senderLocation = recipient.location || "";
            }
          }
          return message;
        })
      );

      setAllMessages(messagesWithSenderInfo);
      setTimeout(() => {
        scrollToBottom(true);
      }, 300);
    } catch (error) {
      console.error("❌ LOAD MESSAGES ERROR:", error);
      logError(error, {
        description: "LOAD MESSAGES ERROR:",
      });
    }
  };

  // FIXED: Save draft before switching to edit mode
  const handleEditMessage = async (message) => {
    if (
      message.status !== "pending_review" ||
      message.sent_by?.id !== user?.uid
    ) {
      return;
    }

    if (messageContent.trim().length > 0 && !editingMessageId) {
      try {
        await saveDraft(messageContent);
      } catch (error) {
        console.error("❌ Failed to save draft before editing message:", error);
        const confirmSwitch = window.confirm(
          "Failed to save your draft. Do you want to continue editing this message? Your current draft may be lost."
        );
        if (!confirmSwitch) {
          return;
        }
      }
    }

    setEditingMessageId(message.id);
    setEditingMessageOriginalContent(message.content);
    setMessageContent(message.content);
    setIsEditing(true);
    setHasDraftContent(true);
    setSelectedMessageId(null);

    setTimeout(() => {
      textAreaRef.current?.focus();
      if (textAreaRef.current) {
        const length = textAreaRef.current.value.length;
        textAreaRef.current.setSelectionRange(length, length);
      }
    }, 100);
  };

  const handleReplyClick = async () => {
    setIsEditing(true);

    if (!draft?.id) {
      try {
        const letterUserRef = userRef || doc(db, "users", user.uid);
        const existingDraft = await fetchDraft(id, letterUserRef, false);

        if (existingDraft) {
          setDraft(existingDraft);
          setMessageContent(existingDraft.content || "");
          setHasDraftContent(Boolean(existingDraft.content?.trim()));
        } else {
          setMessageContent("");
          setHasDraftContent(false);
        }
      } catch (error) {
        console.error("❌ Error fetching draft:", error);
        setMessageContent("");
        setHasDraftContent(false);
      }
    } else {
      setMessageContent(draft.content || "");
      setHasDraftContent(Boolean(draft.content?.trim()));
    }

    setTimeout(() => {
      textAreaRef.current?.focus();
      if (textAreaRef.current) {
        const length = textAreaRef.current.value.length;
        textAreaRef.current.setSelectionRange(length, length);
      }
    }, 100);
  };

  usePageAnalytics(`/letters/[id]`);

  useEffect(() => {
    const chat_user = localStorage.getItem("chat_user");
    setUserType(chat_user);

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setIsLoading(true);

      if (!currentUser) {
        router.push("/login");
        return;
      }

      setUser(currentUser);

      try {
        const letterboxRef = doc(db, "letterbox", id);
        const letterboxDoc = await getDoc(letterboxRef);

        if (!letterboxDoc.exists()) {
          console.error("❌ Letterbox does not exist:", id);
          setIsLoading(false);
          return;
        }

        const userDocRef = doc(db, "users", currentUser.uid);
        setUserRef(userDocRef);

        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.location) {
            const location = userData.location;
            setUserLocation(location);
          }
          setProfileImage(userData?.photo_uri || "");
        }

        const fetchedRecipients = await fetchRecipients(id);
        setRecipients(fetchedRecipients || []);

        if (fetchedRecipients?.length > 0) {
          const recipientName = `${fetchedRecipients[0].first_name} ${fetchedRecipients[0].last_name}`;
          setRecipientName(recipientName);
        }

        const lRef = collection(letterboxRef, "letters");
        setLettersRef(lRef);
        const draftData = await fetchDraft(id, userDocRef, false);

        if (draftData && draftData.status === "draft") {
          setDraft(draftData);
          const draftContent = draftData.content || "";
          const hasContent = Boolean(draftContent.trim());

          setMessageContent(draftContent);
          setHasDraftContent(hasContent);

          if (hasContent) {
            setIsEditing(true);
            setTimeout(() => {
              textAreaRef.current?.focus();
              const length = draftContent.length;
              textAreaRef.current?.setSelectionRange(length, length);
            }, 100);
          } else {
            setIsEditing(false);
          }
        } else {
          setIsEditing(false);
          setMessageContent("");
          setDraft(null);
          setHasDraftContent(false);
        }

        if (fetchedRecipients?.length > 0) {
          const sentQuery = query(
            lRef,
            where("status", "==", "sent"),
            orderBy("created_at", "desc"),
            limit(20)
          );

          const myPendingQuery = query(
            lRef,
            where("status", "==", "pending_review"),
            where("sent_by", "==", userDocRef),
            orderBy("created_at", "desc"),
            limit(20)
          );

          const otherUserRefs = fetchedRecipients
            .filter((r) => r.id !== currentUser.uid)
            .map((r) => doc(db, "users", r.id));

          const queryPromises = [getDocs(sentQuery), getDocs(myPendingQuery)];

          for (const otherUserRef of otherUserRefs) {
            const otherPendingQuery = query(
              lRef,
              where("status", "==", "pending_review"),
              where("sent_by", "==", otherUserRef),
              orderBy("created_at", "desc"),
              limit(20)
            );
            queryPromises.push(getDocs(otherPendingQuery));
          }

          const snapshots = await Promise.all(queryPromises);

          const allFetchedMessages = [];

          snapshots.forEach((snapshot, index) => {
            snapshot.docs.forEach((docSnap) => {
              const messageData = {
                id: docSnap.id,
                ...docSnap.data(),
                created_at:
                  docSnap.data().created_at?.toDate?.() ||
                  docSnap.data().created_at,
                updated_at:
                  docSnap.data().updated_at?.toDate?.() ||
                  docSnap.data().updated_at,
              };
              allFetchedMessages.push(messageData);
            });
          });

          const sortedMessages = allFetchedMessages.sort((a, b) => {
            const aTime =
              a.created_at instanceof Date
                ? a.created_at
                : a.created_at.toDate();
            const bTime =
              b.created_at instanceof Date
                ? b.created_at
                : b.created_at.toDate();
            return aTime.getTime() - bTime.getTime();
          });

          const messagesWithSenderInfo = await Promise.all(
            sortedMessages.map(async (message) => {
              if (message.sent_by?.id !== currentUser.uid) {
                const recipient = fetchedRecipients.find(
                  (r) => r.id === message.sent_by?.id
                );
                if (recipient) {
                  message.senderLocation = recipient.location || "";
                }
                if (message?.unread) {
                  await updateDoc(doc(lRef, message.id), { unread: false });
                }
              }
              return message;
            })
          );

          setAllMessages(messagesWithSenderInfo);
        }
      } catch (error) {
        console.error("❌ INITIALIZATION ERROR:", error);
        logError(error, {
          description: "INITIALIZATION ERROR:",
        });
      } finally {
        setIsLoading(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [id, router]);

  useEffect(() => {
    return () => {
      if (draftTimer) {
        clearTimeout(draftTimer);
      }
    };
  }, [draftTimer]);

  useEffect(() => {
    scrollToBottom();
  }, [allMessages, isEditing]);

  if (isLoading) {
    return <LettersSkeleton />;
  }

  const selectMessage = (messageId) => {
    setSelectedMessageId(messageId === selectedMessageId ? null : messageId);
  };

  const truncateMessage = (message) => {
    if (message.length <= 30) return message;
    return `${message.substring(0, 30)}...`;
  };

  const getSenderLocation = (message) => {
    const isSenderUser = message.sent_by?.id === user?.uid;
    if (isSenderUser) {
      return userLocation || "";
    } else {
      return message.senderLocation || recipients[0]?.location || "";
    }
  };

  const canSendMessage = () => {
    const canSend = messageContent.trim().length > 0 && !isSending;
    return canSend;
  };

  return (
    <div className="bg-gray-100 min-h-screen py-6">
      <div className="max-w-lg mx-auto bg-white shadow-md rounded-lg overflow-hidden flex flex-col h-[90vh]">
        <div className="bg-blue-100 p-4 flex items-center justify-between border-b">
          {isXButtonDisabled || isUpdatingFirebase ? (
            <div className="w-6 h-6 flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-gray-400 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
          ) : (
            <button
              onClick={handleCloseMessage}
              className="text-gray-700 cursor-pointer hover:text-gray-900"
              title="Close conversation">
              X
            </button>
          )}

          {isEditing && (
            <button
              onClick={handleSendMessage}
              disabled={!canSendMessage()}
              className={`p-1 ${
                !canSendMessage()
                  ? "cursor-not-allowed opacity-50"
                  : "hover:bg-blue-200 rounded"
              }`}>
              <Image
                src="/send-message-icon.png"
                alt={editingMessageId ? "Update message" : "Send message"}
                width={30}
                height={30}
                className="object-contain"
                id="send-letter"
              />
            </button>
          )}
        </div>

        {editingMessageId && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center text-amber-800 text-sm">
              <span className="mr-2">✏️</span>
              <span>Editing message</span>
            </div>
            <button
              onClick={async () => {
                const letterUserRef = userRef || doc(db, "users", user.uid);

                try {
                  const existingDraft = await fetchDraft(
                    id,
                    letterUserRef,
                    false
                  );

                  if (existingDraft && existingDraft.content?.trim()) {
                    setDraft(existingDraft);
                    setMessageContent(existingDraft.content);
                    setHasDraftContent(true);
                    setIsEditing(true);
                  } else {
                    setMessageContent("");
                    setDraft(null);
                    setHasDraftContent(false);
                    setIsEditing(false);
                  }
                } catch (error) {
                  console.error("❌ Failed to restore draft:", error);
                  setMessageContent("");
                  setDraft(null);
                  setHasDraftContent(false);
                  setIsEditing(false);
                }

                setEditingMessageId(null);
                setEditingMessageOriginalContent("");
                setSelectedMessageId(null);
              }}
              className="text-amber-600 hover:text-amber-800 text-sm underline">
              Cancel
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto bg-gray-100">
          {allMessages.map((message, index) => {
            const messageId = message.id;
            const isSelected = selectedMessageId === messageId;
            const isSenderUser = message.sent_by?.id === user?.uid;
            const location = getSenderLocation(message);

            const showDateSeparator =
              index === 0 ||
              isDifferentDay(
                allMessages[index - 1]?.created_at,
                message.created_at
              );

            return (
              <div key={messageId}>
                <div
                  className={`border-b border-gray-200 ${
                    isSelected ? "bg-white" : "bg-gray-50"
                  } ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                  <div
                    className="px-4 py-3"
                    onClick={() => selectMessage(messageId)}>
                    <div className="flex items-center">
                      <div className="w-12 h-12 rounded-full overflow-hidden mr-3">
                        <ProfileImage
                          photo_uri={
                            isSenderUser
                              ? profileImage
                              : recipients[0]?.photo_uri
                          }
                          first_name={
                            isSenderUser ? "Me" : recipients[0]?.first_name
                          }
                          width={48}
                          height={48}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center">
                          <span className="font-bold text-black">
                            {isSenderUser
                              ? "Me"
                              : `${recipients[0]?.first_name} ${recipients[0]?.last_name}`}
                          </span>
                          {location && (
                            <span className="text-black ml-2 text-sm">
                              {location}
                            </span>
                          )}
                        </div>
                        <div className="text-gray-800">
                          {isSelected ? "" : truncateMessage(message.content)}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="text-gray-500 text-sm">
                          {formatTime(message.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="px-4 pb-3">
                      <div className="ml-16 relative">
                          <p className="text-gray-800 whitespace-pre-wrap">
                          {message.content}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          {!isSenderUser && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();

                                setReportSender(message.sent_by.id);
                                setReportContent(message.content);
                                setShowReportPopup(true);
                                logButtonEvent(
                                  "Report message clicked!",
                                  "/letters/[id]"
                                );
                              }}
                              className="text-xs text-gray-500 hover:text-gray-700 flex items-center">
                              <FaExclamationCircle className="mr-1" size={10} />
                              Report
                            </button>
                          )}
                          {/* STATUS BANNER */}
                          {isSenderUser && (
                            <>
                              {/* REJECTED */}
                              {message.status === "rejected" && (
                                <AlertTriangle className="w-5 h-5 text-red-500 flex justify-end w-full" />
                              )}
                              {/* SENT → GREEN CHECK */}
                              {message.status === "sent" && (
                              <span className="text-green-500 text-lg font-bold flex justify-end w-full">✓</span>
                              )}
                              {/* PENDING REVIEW → GRAY DASHED CHECK */}
                              {message.status === "pending_review" && (
                                <div className="flex items-center justify-end w-full">
                              {/* Wrapper so the check can stick to the button */}
                              <div className="relative inline-flex">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();

                                    handleEditMessage(message);
                                    logButtonEvent(
                                      "Edit message clicked!",
                                      "/letters/[id]"
                                    );
                                  }}
                                  className="absolute -bottom-0.5 right-7 bg-primary text-white text-xs px-2 py-1 rounded-full transition-colors"
                                  title="Edit message"
                                >
                                  Edit
                                </button>

                                {/* Check badge in bottom-right of the button */}
                                <div className="w-5 h-5 rounded-full border-2 border-gray-400 border-dashed flex items-center justify-center">
                                  <span className="text-gray-400 text-xs font-bold">✓</span>
                                </div>
                              </div>
                            </div>
                            )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        <div className="bg-white">
          <div className="flex items-center justify-between px-4 py-2">
            <div className="flex items-center">
              <Image
                src="/arrow-left.png"
                alt="Back"
                width={20}
                height={20}
                className="mr-2"
              />
              <span className="text-gray-700">To {recipientName}</span>
            </div>
          </div>

          {!isEditing ? (
            <div className="p-4">
              <div
                className="w-full p-3 border border-cyan-500 rounded-md text-gray-500 cursor-text"
                onClick={handleReplyClick}>
                {hasDraftContent
                  ? "Continue draft..."
                  : "Reply to the letter..."}
              </div>
            </div>
          ) : (
            <div className="p-4 relative" style={{ height: "40vh" }}>
              <textarea
                ref={textAreaRef}
                id="message-input"
                className="w-full h-full p-3 focus:outline-none resize-none text-black bg-white"
                placeholder={
                  editingMessageId
                    ? "Edit your message..."
                    : "Write your message..."
                }
                value={messageContent}
                onChange={handleMessageChange}
                style={{
                  overflowWrap: "break-word",
                  wordWrap: "break-word",
                  height: "calc(100% - 24px)",
                }}
              />
            </div>
          )}
        </div>

        {showCloseDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm">
            <div className="bg-gray-100 p-6 rounded-2xl shadow-lg w-[345px] h-[245px] mx-auto">
              <h2 className="text-xl font-semibold mb-1 text-black leading-tight">
                {editingMessageId ? "Discard changes?" : "Close this message?"}
              </h2>
              <p className="text-gray-600 mb-6 text-sm">
                {editingMessageId
                  ? "Your changes will not be saved."
                  : "Your message will be saved as a draft."}
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={handleContinueEditing}
                  className="flex-1 !bg-[#4E802A] !text-white py-3 px-4 !rounded-2xl hover:!bg-opacity-90 transition-colors">
                  Stay on page
                </button>
                <button
                  onClick={handleConfirmClose}
                  className="flex-1 !bg-gray-200 !text-[#4E802A] py-3 px-4 !rounded-2xl hover:!bg-gray-300 transition-colors">
                  {editingMessageId ? "Discard" : "Close"}
                </button>
              </div>
            </div>
          </div>
        )}

        {showReportPopup && (
          <ReportPopup
            setShowPopup={setShowReportPopup}
            setShowConfirmReportPopup={setShowConfirmReportPopup}
            sender={reportSender}
            content={reportContent}
          />
        )}
        {showConfirmReportPopup && (
          <ConfirmReportPopup setShowPopup={setShowConfirmReportPopup} />
        )}
      </div>
    </div>
  );
}
