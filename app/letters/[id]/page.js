"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { db } from "../../firebaseConfig";
import {
  collection,
  doc,
  getDoc,
  updateDoc,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  fetchRecipients,
} from "../../../app/utils/letterboxFunctions";
import { formatTime } from "../../../app/utils/dateHelpers";
import ProfileImage from "../../../components/general/ProfileImage";
import { FaExclamationCircle } from "react-icons/fa";
import ReportPopup from "../../../components/general/letter/ReportPopup";
import ConfirmReportPopup from "../../../components/general/letter/ConfirmReportPopup";
import { useRouter } from "next/navigation";
import LettersSkeleton from "../../../components/loading/LettersSkeleton";
import Image from "next/image";
import Button from "../../../components/general/Button";
import { PageContainer } from "../../../components/general/PageContainer";
import { PageBackground } from "../../../components/general/PageBackground";
import { AlertTriangle } from "lucide-react";
import Dialog from "../../../components/general/Dialog";
import { logButtonEvent, logError } from "../../utils/analytics";
import { usePageAnalytics } from "../../useAnalytics";
import React from "react";
import { formatTimestamp } from "../../../app/utils/dateHelpers";

// FIXED: Enhanced fetchDraft function that prevents duplicate drafts
const fetchDraft = async (letterboxId, userRef, shouldCreate = false) => {
  try {
    const letterboxRef = doc(db, "letterbox", letterboxId);
    const lettersRef = collection(letterboxRef, "letters");

    // FIXED: Query for existing drafts by this user (order by updated_at desc to get most recent)
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

      // CRITICAL: Always return the existing draft, even if content is empty
      // This prevents creating duplicate drafts
      return draftData;
    }

    // Only create new draft if explicitly requested and no existing draft
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
    return null;
  }
};

export default function Page({ params }) {
  const { id } = params;

  const auth = getAuth();
  const router = useRouter();
  const messagesEndRef = useRef(null);
  const textAreaRef = useRef(null);

  // User and auth states
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const [userRef, setUserRef] = useState(null);
  const [userLocation, setUserLocation] = useState("");
  const [profileImage, setProfileImage] = useState(""); // ADDED: Profile image state

  // Message and draft states
  const [messageContent, setMessageContent] = useState(""); // FIXED: Start with empty string
  const messageInputRef = useRef(null);
  const [draft, setDraft] = useState(null);
  const [hasDraftContent, setHasDraftContent] = useState(false);

  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingMessageOriginalContent, setEditingMessageOriginalContent] = useState("");

  const [allMessages, setAllMessages] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [recipientName, setRecipientName] = useState("");
  const [lettersRef, setLettersRef] = useState(null);

  // UI states
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // NEW: State for disabling X button after select all and delete
  const [isXButtonDisabled, setIsXButtonDisabled] = useState(false);

  // NEW: State to track Firebase update status
  const [isUpdatingFirebase, setIsUpdatingFirebase] = useState(false);

  // Report states
  const [showReportPopup, setShowReportPopup] = useState(false);
  const [showConfirmReportPopup, setShowConfirmReportPopup] = useState(false);
  const [reportContent, setReportContent] = useState(null);
  const [reportSender, setReportSender] = useState(null);

  // Auto-save draft timer
  const [draftTimer, setDraftTimer] = useState(null);

  const scrollToBottom = (instant = false) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: instant ? "auto" : "smooth",
      block: "end",
    });
  };

  // ENHANCED: saveDraft function with Firebase update tracking
  const saveDraft = useCallback(
    async (content) => {
      if (!user || !lettersRef || isSending) {
        return Promise.resolve();
      }

      // Set updating status when starting Firebase operation
      setIsUpdatingFirebase(true);

      try {
        const letterUserRef = userRef || doc(db, "users", user.uid);
        const trimmedContent = content.trim();
        const currentTime = new Date();

        // FIXED: Always check for existing draft first
        let existingDraft = draft;

        // If no draft in state, fetch from database
        if (!existingDraft?.id) {
          existingDraft = await fetchDraft(id, letterUserRef, false);

          if (existingDraft) {
            setDraft(existingDraft); // Update state with found draft
          }
        }

        // FIXED: Prepare draft data with proper structure
        const baseDraftData = {
          sent_by: letterUserRef,
          content: trimmedContent, // Store actual content (can be empty)
          status: "draft",
          updated_at: currentTime,
          deleted: null,
          unread: true,
        };

        if (existingDraft?.id) {
          const draftDocRef = doc(lettersRef, existingDraft.id);

          // FIXED: Always update existing draft, don't check if it exists
          const updateData = {
            ...baseDraftData,
            created_at: existingDraft.created_at || currentTime, // Preserve original created_at
          };

          await updateDoc(draftDocRef, updateData);
          // Update local state
          setDraft({ ...updateData, id: existingDraft.id });
        } else {
          // Create new draft
          const newDraftData = {
            ...baseDraftData,
            created_at: currentTime,
          };

          const newDraftRef = doc(lettersRef);
          await setDoc(newDraftRef, newDraftData);

          // Update local state
          setDraft({ ...newDraftData, id: newDraftRef.id });
        }

        // FIXED: Update UI state consistently
        const hasContent = Boolean(trimmedContent);

        setHasDraftContent(hasContent);

        // If content is empty, exit edit mode
        if (!hasContent && isEditing) {
          setIsEditing(false);
        }

        return Promise.resolve();
      } catch (error) {
        // More specific error handling
        if (error.code === "permission-denied") {
          alert("Permission denied. Please check your access rights.");
        } else if (error.code === "not-found") {
          // Reset draft state and try again if we have content
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
        // Clear updating status when Firebase operation completes
        setIsUpdatingFirebase(false);
      }
    },
    [user, lettersRef, isSending, draft, userRef, isEditing, id]
  );

  // ENHANCED: Message change handler with Promise-based X button management
  const handleMessageChange = async (e) => {
    const newContent = e.target.value;

    setMessageContent(newContent);
    const trimmedContent = newContent.trim();

    // Clear any existing timer
    if (draftTimer) {
      clearTimeout(draftTimer);
      setDraftTimer(null);
    }

    // FIXED: Update UI state based on content
    if (trimmedContent.length > 0) {
      setIsEditing(true);
      setHasDraftContent(true);

      // Auto-save draft after 1 second of no typing (debounced)
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
      setHasDraftContent(false);

      // FIXED: Always save empty content to existing draft, exit edit mode immediately
      setIsEditing(false); // Exit edit mode immediately for empty content

      // NEW: Disable X button and track Firebase update completion
      setIsXButtonDisabled(true);

      try {
        // Wait for Firebase update to complete
        await saveDraft(newContent);

        // Re-enable X button after Firebase update completes
        setIsXButtonDisabled(false);
      } catch (error) {
        logError(error, {
          description: "Failed to save empty draft:",
        });
        // Re-enable X button even if there was an error (fallback after 3 seconds)
        setTimeout(() => {
          console.log("⚠️ Re-enabling X button after error (fallback)");
          setIsXButtonDisabled(false);
        }, 3000);
      }
    }
  };

  // Enhanced send message function
  const handleSendMessage = async () => {
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
      // Validate required dependencies
      if (!user || !lettersRef) {
        throw new Error("Missing required dependencies: user or lettersRef");
      }

      const letterUserRef = userRef || doc(db, "users", user.uid);
      const currentTime = new Date();

      const messageData = {
        sent_by: letterUserRef,
        content: trimmedContent,
        status: "sent",
        created_at: currentTime,
        updated_at: currentTime,
        deleted: null,
        unread: true,
      };

      let messageRef;

      if (draft?.id) {
        messageRef = doc(lettersRef, draft.id);

        // Update existing draft to sent
        const updateData = {
          ...messageData,
          created_at: draft.created_at || currentTime, // Preserve original created_at
        };

        await updateDoc(messageRef, updateData);
      } else {
        messageRef = doc(lettersRef);
        await setDoc(messageRef, messageData);
      }

      // Clear states

      setMessageContent("");
      setDraft(null);
      setHasDraftContent(false);
      setIsEditing(false);

      // Add message to UI immediately
      const messageWithId = {
        ...messageData,
        id: messageRef.id,
        sent_by: { id: user.uid },
      };

      setAllMessages((prev) => {
        const newMessages = [...prev, messageWithId];

        return newMessages;
      });

      // Scroll to bottom
      setTimeout(() => {
        scrollToBottom(true);
      }, 100);
    } catch (error) {
      // More specific error handling
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

  // ENHANCED: Close message handler with Firebase status awareness
  const handleCloseMessage = async () => {
    // NEW: Prevent closing if X button is disabled OR Firebase is updating
    if (isXButtonDisabled || isUpdatingFirebase) {
      return;
    }

    const trimmedMessageContent = messageContent.trim();

    // If we're in edit mode, save current state before proceeding
    if (isEditing) {
      try {
        await saveDraft(messageContent);
      } catch (error) {
        logError(error, {
          description: "Failed to save state before close:",
        });
      }
    }

    // Only show dialog if there's content to save (requirement 2)
    if (trimmedMessageContent.length > 0) {
      setShowCloseDialog(true);
    } else {
      router.back();
    }
  };

  // Enhanced confirm close handler
  const handleConfirmClose = async () => {
    setShowCloseDialog(false);

    router.back();
  };

  // Continue editing with logging
  const handleContinueEditing = () => {
    setShowCloseDialog(false);
    setIsEditing(true);

    setTimeout(() => {
      textAreaRef.current?.focus();
    }, 100);
  };

  // Handle report button click for the user (not a specific message)
  const handleReportUserClick = () => {
    if (recipients.length > 0) {
      setReportSender(recipients[0].id);
      setReportContent("General report about user behavior");
      setShowReportPopup(true);
    }
  };

  // Load messages with comprehensive logging
  const loadMessages = async () => {
    if (!user || !id || !recipients.length) {
      return;
    }

    try {
      const { messages } = await fetchLetterbox(id, 20);

      const sortedMessages = messages.sort((a, b) => {
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
      logError(error, {
        description: "LOAD MESSAGES ERROR:",
      });
    }
  };

  const handleReplyClick = async () => {
    setIsEditing(true);

    // Check if we need to fetch draft from database
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
        setMessageContent("");
        setHasDraftContent(false);
      }
    } else {
      // Use existing draft from state

      setMessageContent(draft.content || "");
      setHasDraftContent(Boolean(draft.content?.trim()));
    }

    // Focus the textarea after switching to edit mode
    setTimeout(() => {
      textAreaRef.current?.focus();
      // Set cursor at the end
      if (textAreaRef.current) {
        const length = textAreaRef.current.value.length;
        textAreaRef.current.setSelectionRange(length, length);
      }
    }, 100);
  };

  usePageAnalytics(`/letters/[id]`);

  // FIXED: Enhanced initialization with improved draft handling
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
      console.log("👤 User set in state:", currentUser.uid);

      try {
        // Check letterbox exists
        const letterboxRef = doc(db, "letterbox", id);
        const letterboxDoc = await getDoc(letterboxRef);

        if (!letterboxDoc.exists()) {
          setIsLoading(false);
          return;
        }
        // Set user ref and fetch user data
        const userDocRef = doc(db, "users", currentUser.uid);
        setUserRef(userDocRef);

        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.location) {
            const location = userData.location;

            setUserLocation(location);
          }
          // ADDED: Set profile image
          setProfileImage(userData?.photo_uri || "");
        }

        // Fetch recipients

        const fetchedRecipients = await fetchRecipients(id);
        setRecipients(fetchedRecipients || []);

        if (fetchedRecipients?.length > 0) {
          const recipientName = `${fetchedRecipients[0].first_name} ${fetchedRecipients[0].last_name}`;

          setRecipientName(recipientName);
        }

        // Set letters ref
        const lRef = collection(letterboxRef, "letters");
        setLettersRef(lRef);

        // ENHANCED: Improved draft fetching with better error handling
        const draftData = await fetchDraft(id, userDocRef, false);

        if (draftData && draftData.status === "draft") {
          setDraft(draftData);
          const draftContent = draftData.content || "";
          const hasContent = Boolean(draftContent.trim());

          // FIXED: Always set the draft content, even if empty
          setMessageContent(draftContent);
          setHasDraftContent(hasContent);

          // Enter edit mode only if draft has actual content
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

        // Load messages if we have recipients
        if (fetchedRecipients?.length > 0) {
          const userRefDoc = doc(db, "users", currentUser.uid);

          // All messages written BY ME
          const myMessagesQuery = query(
            lRef,
            where("sent_by", "==", userRefDoc),
            orderBy("created_at", "asc")
          );
      
          // All messages with status = "sent" (approval by admin)
          const sentMessagesQuery = query(
            lRef,
            where("status", "==", "sent"),
            orderBy("created_at", "asc")
          );
      
          const [mySnap, sentSnap] = await Promise.all([
            getDocs(myMessagesQuery),
            getDocs(sentMessagesQuery),
          ]);
      
          const all = [];
      
          const pushDocs = (snap) => {
            snap.forEach((docSnap) => {
              // Skip drafts on client side
              if (docSnap.data().status === "draft") {
                return;
              }
              
              const msg = {
                id: docSnap.id,
                ...docSnap.data(),
                created_at: docSnap.data().created_at?.toDate(),
                updated_at: docSnap.data().updated_at?.toDate(),
              };
      
              // Normalize Firestore DocumentReference → { id }
              if (msg.sent_by?.path) {
                msg.sent_by = {
                  id: msg.sent_by.path.split("/")[1],
                };
              }
      
              all.push(msg);
            });
          };
      
          pushDocs(mySnap);
          pushDocs(sentSnap);
      
          // remove duplicates
          const unique = Array.from(new Map(all.map((m) => [m.id, m])).values());
      
          // sort chronologically
          const sortedMessages = unique.sort((a, b) => a.created_at - b.created_at);
          const messagesWithSenderInfo = await Promise.all(
            sortedMessages.map(async (message) => {
              if (message.sent_by?.id !== currentUser.uid) {
                const recipient = fetchedRecipients.find(
                  (r) => r.id === message.sent_by?.id
                );
                if (recipient) {
                  message.senderLocation = recipient.location || "";
                }
                // Mark as read
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
  }, [auth, id, router]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (draftTimer) {
        clearTimeout(draftTimer);
      }
    };
  }, [draftTimer]);

  // Auto-scroll when messages change or edit mode changes
  useEffect(() => {
    scrollToBottom();
  }, [allMessages, isEditing]);

  if (isLoading) {
    return <LettersSkeleton />;
  }

  const selectMessage = (messageId) => {
    setSelectedMessageId(messageId === selectedMessageId ? null : messageId);
    // Don't exit edit mode when selecting a message if we're editing
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
  <PageBackground className="bg-gray-100 h-screen flex flex-col overflow-hidden">
    <PageContainer
      width="compactXS"
      padding="none"
      center={false}
      className="min-h-[100dvh] flex flex-col bg-white rounded-2xl shadow-lg overflow-hidden"
    >
      {/* ===== HEADER ===== */}
      <div className="bg-blue-100 p-4 flex items-center justify-between border-b min-h-[64px]">
        <button
          onClick={handleCloseMessage}
          className="text-gray-700 cursor-pointer hover:text-gray-900 pl-3"
          title="Close conversation"
        >
          X
        </button>

        {/* Keep header layout stable (no mount/unmount jumps) */}
        <div className="w-10 h-10 flex items-center justify-center">
          {isSending || isUpdatingFirebase ? (
            <div className="w-6 h-6 flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-gray-400 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
          ) : (
            <button
              onClick={handleSendMessage}
              disabled={!isEditing || !canSendMessage()}
              className={`p-1 ${
                !isEditing || !canSendMessage()
                  ? "cursor-not-allowed opacity-50"
                  : "hover:bg-blue-200 rounded"
              }`}
              style={{ visibility: isEditing ? "visible" : "hidden" }}
            >
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
      </div>

      {/* ===== EDITING BANNER ===== */}
      {editingMessageId && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 min-h-[44px] flex items-center justify-between">
          <div className="flex items-center text-amber-800 text-sm min-w-0">
            <span className="mr-2 shrink-0" aria-hidden="true">
              ✏️
            </span>
            <span className="whitespace-nowrap truncate">Editing message</span>
          </div>

          <button
            onClick={async () => {
              const letterUserRef = userRef || doc(db, "users", user.uid);

              try {
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
              } catch {
                setMessageContent("");
                setDraft(null);
                setHasDraftContent(false);
                setIsEditing(false);
              }

              setEditingMessageId(null);
              setEditingMessageOriginalContent("");
              setSelectedMessageId(null);
            }}
            className="text-amber-600 hover:text-amber-800 text-sm underline shrink-0 whitespace-nowrap"
          >
            {/* Keep banner height consistent while editing */}
            Cancel
          </button>
        </div>
      )}

      {/* ===== MESSAGES ===== */}
      <div className="flex-1 overflow-y-auto bg-gray-100">
        {allMessages.map((message, index) => {
          const messageId = message.id;
          const isSelected = selectedMessageId === messageId;
          const isSenderUser = message.sent_by?.id === user?.uid;
          const location = getSenderLocation(message);

          return (
            <div key={messageId}>
              <div
                className={`border-b border-gray-200 ${
                  isSelected ? "bg-white" : "bg-gray-50"
                } ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
              >
                <div
                  className="px-4 py-3"
                  onClick={() => selectMessage(messageId)}
                >
                  <div className="flex items-center">
                    <div className="shrink-0">
                      <ProfileImage
                        photo_uri={
                          isSenderUser ? profileImage : recipients[0]?.photo_uri
                        }
                        first_name={
                          isSenderUser ? "Me" : recipients[0]?.first_name
                        }
                        size={12}
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
                        {formatTimestamp(message.created_at)}
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
                      <div className="flex items-center justify-end w-full">
                        {!isSenderUser && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();

                              setReportSender(message.sent_by?.id);
                              setReportContent(message.content);
                              setShowReportPopup(true);
                              logButtonEvent(
                                "Report message clicked!",
                                "/letters/[id]"
                              );
                            }}
                            className="text-xs text-gray-500 hover:text-gray-700 flex items-center"
                          >
                            <FaExclamationCircle className="mr-1" size={10} />
                            Report
                          </button>
                        )}

                        {/* STATUS BANNER */}
                        {isSenderUser && (
                          <>
                            {/* REJECTED */}
                            {isSenderUser && message.status === "rejected" && (
                              <div className="bg-red-50 border border-red-300 rounded-lg p-3 mb-2">
                                <div className="flex items-start text-red-700 font-semibold">
                                  <AlertTriangle className="w-5 h-5 mr-2 mt-0.5" />
                                  <div>
                                    <div>Your letter was not sent.</div>

                                    {message.rejection_reason && (
                                      <div className="text-sm text-red-600 mt-1">
                                        {message.rejection_reason}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* SENT → GREEN CHECK */}
                            {message.status === "sent" && (
                              <span className="text-green-500 text-lg font-bold flex justify-end w-full">
                                ✓
                              </span>
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
                                    className="absolute -bottom-0.5 right-7 bg-blue-600 text-white text-xs px-2 py-1 rounded-full transition-colors hover:bg-blue-700"
                                    title="Edit message"
                                  >
                                    Edit
                                  </button>

                                  {/* Check badge in bottom-right of the button */}
                                  <div className="w-5 h-5 rounded-full border-2 border-gray-400 border-dashed flex items-center justify-center">
                                    <span className="text-gray-400 text-xs font-bold">
                                      ✓
                                    </span>
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

      {/* ===== REPLY ===== */}
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
              onClick={handleReplyClick}
            >
              {hasDraftContent ? "Continue draft..." : "Reply to the letter..."}
            </div>
          </div>
        ) : (
          <div className="p-4 relative" style={{ height: "40vh" }}>
            <textarea
              ref={textAreaRef}
              className="w-full h-full p-3 focus:outline-none resize-none text-black bg-white"
              placeholder={
                editingMessageId ? "Edit your message..." : "Write your message..."
              }
              value={messageContent}
              onChange={handleMessageChange}
            />
          </div>
        )}
      </div>

      {/* ===== POPUPS ===== */}
      {showCloseDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm">
          <div className="bg-gray-100 p-6 rounded-2xl shadow-lg w-[345px] mx-auto max-h-[80vh] overflow-auto">
            <h2 className="text-xl font-semibold mb-1 text-black">
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
                className="flex-1 bg-[#4E802A] text-white py-3 px-4 rounded-2xl"
              >
                Stay on page
              </button>
              <button
                onClick={handleConfirmClose}
                className="flex-1 bg-gray-200 text-[#4E802A] py-3 px-4 rounded-2xl"
              >
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
    </PageContainer>
  </PageBackground>
);
}