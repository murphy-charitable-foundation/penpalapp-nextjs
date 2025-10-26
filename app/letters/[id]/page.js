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

// FIXED: Enhanced fetchDraft function that prevents duplicate drafts
const fetchDraft = async (letterboxId, userRef, shouldCreate = false) => {
  console.log("📝 fetchDraft called:", {
    letterboxId,
    userRef: userRef?.id,
    shouldCreate,
  });

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

    console.log("🔍 Querying for existing draft...");
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

      console.log("✅ Found existing draft:", draftData);
      return draftData;
    }

    console.log("❌ No existing draft found");

    // Only create new draft if explicitly requested and no existing draft
    if (shouldCreate) {
      console.log("🆕 Creating new draft...");
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

      console.log("✅ New draft created:", newDraftRef.id);
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

  // User and auth states
  const [user, setUser] = useState(null);
  const [userRef, setUserRef] = useState(null);
  const [userLocation, setUserLocation] = useState("");
  const [profileImage, setProfileImage] = useState("");

  // Message and draft states
  const [messageContent, setMessageContent] = useState("");
  const messageInputRef = useRef(null);
  const [draft, setDraft] = useState(null);
  const [hasDraftContent, setHasDraftContent] = useState(false);
  const pathname = usePathname();

  // NEW: State for editing existing message
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingMessageOriginalContent, setEditingMessageOriginalContent] =
    useState("");

  // Chat states
  const [allMessages, setAllMessages] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [recipientName, setRecipientName] = useState("");
  const [lettersRef, setLettersRef] = useState(null);
  const [userType, setUserType] = useState("");

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
    console.log("📜 Scrolling to bottom, instant:", instant);
    messagesEndRef.current?.scrollIntoView({
      behavior: instant ? "auto" : "smooth",
      block: "end",
    });
  };

  // ENHANCED: saveDraft function with Firebase update tracking
  const saveDraft = useCallback(
    async (content) => {
      console.log("💾 saveDraft called:", {
        content: content?.substring(0, 50) + "...",
        hasUser: !!user,
        hasLettersRef: !!lettersRef,
        isSending,
      });

      if (!user || !lettersRef || isSending) {
        console.log("⚠️ saveDraft skipped - missing dependencies");
        return Promise.resolve();
      }

      // Set updating status when starting Firebase operation
      setIsUpdatingFirebase(true);
      console.log("🔄 Firebase update started");

      try {
        const letterUserRef = userRef || doc(db, "users", user.uid);
        const trimmedContent = content.trim();
        const currentTime = new Date();

        console.log("📝 Trimmed content length:", trimmedContent.length);

        // FIXED: Always check for existing draft first
        let existingDraft = draft;

        // If no draft in state, fetch from database
        if (!existingDraft?.id) {
          console.log("🔍 No draft in state, fetching from database...");
          existingDraft = await fetchDraft(id, letterUserRef, false);

          if (existingDraft) {
            console.log("✅ Found draft from database:", existingDraft.id);
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
          console.log("📝 Updating existing draft:", existingDraft.id);
          const draftDocRef = doc(lettersRef, existingDraft.id);

          // FIXED: Always update existing draft, don't check if it exists
          const updateData = {
            ...baseDraftData,
            created_at: existingDraft.created_at || currentTime, // Preserve original created_at
          };

          await updateDoc(draftDocRef, updateData);
          console.log("✅ Draft updated successfully");

          // Update local state
          setDraft({ ...updateData, id: existingDraft.id });
        } else {
          console.log("🆕 Creating new draft document");
          // Create new draft
          const newDraftData = {
            ...baseDraftData,
            created_at: currentTime,
          };

          const newDraftRef = doc(lettersRef);
          await setDoc(newDraftRef, newDraftData);

          console.log("✅ New draft created:", newDraftRef.id);

          // Update local state
          setDraft({ ...newDraftData, id: newDraftRef.id });
        }

        // FIXED: Update UI state consistently
        const hasContent = Boolean(trimmedContent);
        console.log("📊 Draft has content:", hasContent);

        setHasDraftContent(hasContent);

        // If content is empty, exit edit mode
        if (!hasContent && isEditing) {
          console.log("🚪 Exiting edit mode - no content");
          setIsEditing(false);
        }

        return Promise.resolve();
      } catch (error) {
        console.error("❌ saveDraft error:", error);

        // More specific error handling
        if (error.code === "permission-denied") {
          console.error("🔒 Permission denied error");
          alert("Permission denied. Please check your access rights.");
        } else if (error.code === "not-found") {
          console.error("🔍 Document not found, attempting retry...");
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

              console.log("✅ Draft created on retry:", newDraftRef.id);
              setDraft({ ...newDraftData, id: newDraftRef.id });
            } catch (retryError) {
              console.error("❌ Retry failed:", retryError);
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
        console.log("✅ Firebase update completed");
      }
    },
    [user, lettersRef, isSending, draft, userRef, isEditing, id]
  );

  // ENHANCED: Message change handler with Promise-based X button management
  const handleMessageChange = async (e) => {
    const newContent = e.target.value;
    console.log("✏️ handleMessageChange:", {
      contentLength: newContent.length,
      isEditingMessage: !!editingMessageId,
    });

    setMessageContent(newContent);
    const trimmedContent = newContent.trim();

    // Clear any existing timer
    if (draftTimer) {
      console.log("⏰ Clearing existing draft timer");
      clearTimeout(draftTimer);
      setDraftTimer(null);
    }

    // FIXED: Update UI state based on content
    if (trimmedContent.length > 0) {
      console.log("✅ Content exists, setting edit mode");
      setIsEditing(true);
      setHasDraftContent(true);

      // Auto-save draft after 1 second of no typing (debounced)
      // Only save draft if NOT editing an existing message
      if (!editingMessageId) {
        console.log("⏰ Setting auto-save timer (1 second)");
        const timer = setTimeout(async () => {
          console.log("⏰ Auto-save timer triggered");
          try {
            await saveDraft(newContent);
          } catch (error) {
            console.error("❌ Auto-save failed:", error);
            logError(error, {
              description: "Failed to auto-save draft:",
            });
          }
        }, 1000);
        setDraftTimer(timer);
      } else {
        console.log("📝 Skipping auto-save - editing existing message");
      }
    } else {
      console.log("⚠️ Content is empty");
      setHasDraftContent(false);

      // FIXED: Always save empty content to existing draft, exit edit mode immediately
      setIsEditing(false); // Exit edit mode immediately for empty content

      // Only handle draft saving if NOT editing an existing message
      if (!editingMessageId) {
        console.log("💾 Saving empty draft");
        // NEW: Disable X button and track Firebase update completion
        setIsXButtonDisabled(true);

        try {
          // Wait for Firebase update to complete
          await saveDraft(newContent);

          // Re-enable X button after Firebase update completes
          console.log("✅ Re-enabling X button after Firebase update");
          setIsXButtonDisabled(false);
        } catch (error) {
          console.error("❌ Failed to save empty draft:", error);
          logError(error, {
            description: "Failed to save empty draft:",
          });
          // Re-enable X button even if there was an error (fallback after 3 seconds)
          setTimeout(() => {
            console.log("⚠️ Re-enabling X button after error (fallback)");
            setIsXButtonDisabled(false);
          }, 3000);
        }
      } else {
        console.log(
          "📝 Empty content while editing message - will revert on close"
        );
      }
    }
  };

  // NEW: Function to update existing message
  const handleUpdateMessage = async () => {
    console.log("🔄 handleUpdateMessage called:", {
      editingMessageId,
      contentLength: messageContent.trim().length,
    });

    const trimmedContent = messageContent.trim();

    if (!trimmedContent) {
      console.log("⚠️ No content to update");
      alert("Please enter a message");
      return;
    }

    if (isSending || !editingMessageId) {
      console.log("⚠️ Cannot update - isSending or no editingMessageId:", {
        isSending,
        editingMessageId,
      });
      return;
    }

    setIsSending(true);
    console.log("🔒 Setting isSending to true");

    try {
      // Validate required dependencies
      if (!user || !lettersRef) {
        console.error("❌ Missing required dependencies");
        throw new Error("Missing required dependencies: user or lettersRef");
      }

      const currentTime = new Date();
      const messageRef = doc(lettersRef, editingMessageId);

      console.log("📝 Updating message document:", editingMessageId);

      // Update the existing message
      const updateData = {
        content: trimmedContent,
        updated_at: currentTime,
        // Keep status as pending_review
      };

      await updateDoc(messageRef, updateData);
      console.log("✅ Message updated in Firebase");

      // Clear editing states
      setMessageContent("");
      setEditingMessageId(null);
      setEditingMessageOriginalContent("");
      setIsEditing(false);
      setHasDraftContent(false);
      setSelectedMessageId(null);

      console.log("🧹 Cleared editing states");

      // Update message in UI
      setAllMessages((prev) => {
        const updatedMessages = prev.map((msg) => {
          if (msg.id === editingMessageId) {
            console.log("📝 Updating message in UI state");
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

      // Scroll to bottom
      setTimeout(() => {
        scrollToBottom(true);
      }, 100);

      console.log("✅ Message update completed successfully");
    } catch (error) {
      console.error("❌ handleUpdateMessage error:", error);

      // More specific error handling
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
      console.log("🔓 Setting isSending to false");
    }
  };

  // Enhanced send message function - now creates pending_review status
  const handleSendMessage = async () => {
    console.log("📤 handleSendMessage called:", {
      isEditingMessage: !!editingMessageId,
      contentLength: messageContent.trim().length,
    });

    // If we're editing an existing message, use update function instead
    if (editingMessageId) {
      console.log("🔄 Redirecting to handleUpdateMessage");
      return handleUpdateMessage();
    }

    const trimmedContent = messageContent.trim();

    if (!trimmedContent) {
      console.log("⚠️ No content to send");
      alert("Please enter a message");
      return;
    }

    if (isSending) {
      console.log("⚠️ Already sending a message");
      return;
    }

    setIsSending(true);
    console.log("🔒 Setting isSending to true");

    try {
      // Validate required dependencies
      if (!user || !lettersRef) {
        console.error("❌ Missing required dependencies");
        throw new Error("Missing required dependencies: user or lettersRef");
      }

      const letterUserRef = userRef || doc(db, "users", user.uid);
      const currentTime = new Date();

      // NEW: Changed status to "pending_review" instead of "sent"
      const messageData = {
        sent_by: letterUserRef,
        content: trimmedContent,
        status: "pending_review", // CHANGED from "sent"
        created_at: currentTime,
        updated_at: currentTime,
        deleted: null,
        unread: true,
      };

      console.log("📝 Message data prepared with status: pending_review");

      let messageRef;

      if (draft?.id) {
        console.log("📝 Updating existing draft to pending_review:", draft.id);
        messageRef = doc(lettersRef, draft.id);

        // Update existing draft to sent
        const updateData = {
          ...messageData,
          created_at: draft.created_at || currentTime, // Preserve original created_at
        };

        await updateDoc(messageRef, updateData);
        console.log("✅ Draft updated to pending_review");
      } else {
        console.log("🆕 Creating new message with pending_review status");
        messageRef = doc(lettersRef);
        await setDoc(messageRef, messageData);
        console.log("✅ New message created:", messageRef.id);
      }

      // Clear states
      setMessageContent("");
      setDraft(null);
      setHasDraftContent(false);
      setIsEditing(false);

      console.log("🧹 Cleared message states");

      // Add message to UI immediately
      const messageWithId = {
        ...messageData,
        id: messageRef.id,
        sent_by: { id: user.uid },
      };

      setAllMessages((prev) => {
        const newMessages = [...prev, messageWithId];
        console.log(
          "📊 Added message to UI, total messages:",
          newMessages.length
        );
        return newMessages;
      });

      // Scroll to bottom
      setTimeout(() => {
        scrollToBottom(true);
      }, 100);

      console.log("✅ Message sent successfully");
    } catch (error) {
      console.error("❌ handleSendMessage error:", error);

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
      console.log("🔓 Setting isSending to false");
    }
  };

  // ENHANCED: Close message handler with Firebase status awareness
  const handleCloseMessage = async () => {
    console.log("❌ handleCloseMessage called:", {
      isXButtonDisabled,
      isUpdatingFirebase,
      isEditingMessage: !!editingMessageId,
      hasContent: messageContent.trim().length > 0,
    });

    // NEW: Prevent closing if X button is disabled OR Firebase is updating
    if (isXButtonDisabled || isUpdatingFirebase) {
      console.log("⚠️ Close prevented - button disabled or Firebase updating");
      return;
    }

    const trimmedMessageContent = messageContent.trim();

    // NEW: If editing an existing message, handle differently
    if (editingMessageId) {
      console.log("🔄 Closing while editing existing message");

      // If content changed, show dialog
      if (trimmedMessageContent !== editingMessageOriginalContent.trim()) {
        console.log("📝 Content changed, showing dialog");
        setShowCloseDialog(true);
      } else {
        console.log("📝 Content unchanged, reverting");
        // Content unchanged, just revert
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

    // If we're in edit mode, save current state before proceeding
    if (isEditing) {
      console.log("💾 Saving draft before close");
      try {
        await saveDraft(messageContent);
      } catch (error) {
        console.error("❌ Failed to save state before close:", error);
        logError(error, {
          description: "Failed to save state before close:",
        });
      }
    }

    // Only show dialog if there's content to save (requirement 2)
    if (trimmedMessageContent.length > 0) {
      console.log("📝 Content exists, showing close dialog");
      setShowCloseDialog(true);
    } else {
      console.log("🚪 No content, closing directly");
      router.back();
    }
  };

  // Enhanced confirm close handler
  const handleConfirmClose = async () => {
    console.log("✅ handleConfirmClose called:", {
      isEditingMessage: !!editingMessageId,
    });

    setShowCloseDialog(false);

    // NEW: If editing message and confirming close, revert the edit
    if (editingMessageId) {
      console.log("🔄 Reverting message edit");
      setMessageContent("");
      setEditingMessageId(null);
      setEditingMessageOriginalContent("");
      setIsEditing(false);
      setHasDraftContent(false);
      setSelectedMessageId(null);
    }

    router.back();
  };

  // Continue editing with logging
  const handleContinueEditing = () => {
    console.log("✏️ handleContinueEditing called");
    setShowCloseDialog(false);
    setIsEditing(true);

    setTimeout(() => {
      textAreaRef.current?.focus();
    }, 100);
  };

  // Handle report button click for the user (not a specific message)
  const handleReportUserClick = () => {
    console.log("🚨 handleReportUserClick called");
    if (recipients.length > 0) {
      setReportSender(recipients[0].id);
      setReportContent("General report about user behavior");
      setShowReportPopup(true);
    }
  };

  // Load messages with comprehensive logging
  const loadMessages = async () => {
    console.log("📥 loadMessages called:", {
      hasUser: !!user,
      letterboxId: id,
      recipientsCount: recipients.length,
    });

    if (!user || !id || !recipients.length) {
      console.log("⚠️ loadMessages skipped - missing dependencies");
      return;
    }

    try {
      const { messages } = await fetchLetterbox(id, 20);
      console.log("📊 Fetched messages:", messages.length);

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

      console.log("✅ Messages loaded and sorted");
      setAllMessages(messagesWithSenderInfo);
      setTimeout(() => {
        scrollToBottom(true);
      }, 300);
    } catch (error) {
      console.error("❌ loadMessages error:", error);
      logError(error, {
        description: "LOAD MESSAGES ERROR:",
      });
    }
  };

  // NEW: Handle editing a pending_review message
  const handleEditMessage = async (message) => {
    console.log("✏️ handleEditMessage called:", {
      messageId: message.id,
      status: message.status,
      contentLength: message.content.length,
    });

    // Can only edit if status is pending_review and message is from current user
    if (
      message.status !== "pending_review" ||
      message.sent_by?.id !== user?.uid
    ) {
      console.log("⚠️ Cannot edit message - wrong status or not sender");
      return;
    }

    // Set editing mode
    setEditingMessageId(message.id);
    setEditingMessageOriginalContent(message.content);
    setMessageContent(message.content);
    setIsEditing(true);
    setHasDraftContent(true);
    setSelectedMessageId(null); // Deselect the message

    console.log("✅ Entered edit mode for message:", message.id);

    // Focus the textarea
    setTimeout(() => {
      textAreaRef.current?.focus();
      if (textAreaRef.current) {
        const length = textAreaRef.current.value.length;
        textAreaRef.current.setSelectionRange(length, length);
      }
    }, 100);
  };

  // FIXED: Enhanced handleReplyClick to properly handle existing drafts
  const handleReplyClick = async () => {
    console.log("💬 handleReplyClick called");
    setIsEditing(true);

    // Check if we need to fetch draft from database
    if (!draft?.id) {
      console.log("🔍 No draft in state, fetching from database");
      try {
        const letterUserRef = userRef || doc(db, "users", user.uid);
        const existingDraft = await fetchDraft(id, letterUserRef, false);

        if (existingDraft) {
          console.log("✅ Found existing draft:", existingDraft.id);
          setDraft(existingDraft);
          setMessageContent(existingDraft.content || "");
          setHasDraftContent(Boolean(existingDraft.content?.trim()));
        } else {
          console.log("❌ No existing draft found");
          setMessageContent("");
          setHasDraftContent(false);
        }
      } catch (error) {
        console.error("❌ Error fetching draft:", error);
        setMessageContent("");
        setHasDraftContent(false);
      }
    } else {
      // Use existing draft from state
      console.log("✅ Using existing draft from state:", draft.id);
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
    console.log("🚀 Initialization useEffect triggered");

    const chat_user = localStorage.getItem("chat_user");
    setUserType(chat_user);

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log("👤 Auth state changed:", currentUser?.uid);
      setIsLoading(true);

      if (!currentUser) {
        console.log("⚠️ No user, redirecting to login");
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
          console.error("❌ Letterbox does not exist:", id);
          setIsLoading(false);
          return;
        }

        console.log("✅ Letterbox exists");

        // Set user ref and fetch user data
        const userDocRef = doc(db, "users", currentUser.uid);
        setUserRef(userDocRef);

        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log("✅ User data fetched");
          if (userData.location) {
            const location = userData.location;
            setUserLocation(location);
            console.log("📍 User location set:", location);
          }
          // Set profile image
          setProfileImage(userData?.photo_uri || "");
          console.log("🖼️ Profile image set");
        }

        // Fetch recipients
        console.log("👥 Fetching recipients...");
        const fetchedRecipients = await fetchRecipients(id);
        setRecipients(fetchedRecipients || []);
        console.log("✅ Recipients fetched:", fetchedRecipients?.length);

        if (fetchedRecipients?.length > 0) {
          const recipientName = `${fetchedRecipients[0].first_name} ${fetchedRecipients[0].last_name}`;
          setRecipientName(recipientName);
          console.log("👤 Recipient name set:", recipientName);
        }

        // Set letters ref
        const lRef = collection(letterboxRef, "letters");
        setLettersRef(lRef);
        console.log("✅ Letters ref set");

        // ENHANCED: Improved draft fetching with better error handling
        console.log("📝 Fetching draft...");
        const draftData = await fetchDraft(id, userDocRef, false);

        if (draftData && draftData.status === "draft") {
          console.log("✅ Draft found and loaded:", draftData.id);
          setDraft(draftData);
          const draftContent = draftData.content || "";
          const hasContent = Boolean(draftContent.trim());

          // FIXED: Always set the draft content, even if empty
          setMessageContent(draftContent);
          setHasDraftContent(hasContent);

          // Enter edit mode only if draft has actual content
          if (hasContent) {
            console.log("✏️ Entering edit mode with draft content");
            setIsEditing(true);
            setTimeout(() => {
              textAreaRef.current?.focus();
              const length = draftContent.length;
              textAreaRef.current?.setSelectionRange(length, length);
            }, 100);
          } else {
            console.log("📝 Draft is empty, staying in view mode");
            setIsEditing(false);
          }
        } else {
          console.log("❌ No draft found");
          setIsEditing(false);
          setMessageContent("");
          setDraft(null);
          setHasDraftContent(false);
        }

        // Load messages if we have recipients
        if (fetchedRecipients?.length > 0) {
          console.log("📥 Loading messages...");
          const { messages } = await fetchLetterbox(id, 20);
          console.log("📊 Fetched messages count:", messages.length);

          const sortedMessages = messages.sort((a, b) => {
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
                // Mark as read
                if (message?.unread) {
                  await updateDoc(doc(lRef, message.id), { unread: false });
                  console.log("✅ Marked message as read:", message.id);
                }
              }
              return message;
            })
          );
          setAllMessages(messagesWithSenderInfo);
          console.log("✅ All messages loaded and set");
        }
      } catch (error) {
        console.error("❌ INITIALIZATION ERROR:", error);
        logError(error, {
          description: "INITIALIZATION ERROR:",
        });
      } finally {
        setIsLoading(false);
        console.log("✅ Initialization complete");
      }
    });

    return () => {
      console.log("🧹 Cleaning up auth subscription");
      unsubscribe();
    };
  }, [id, router]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (draftTimer) {
        console.log("🧹 Cleaning up draft timer");
        clearTimeout(draftTimer);
      }
    };
  }, [draftTimer]);

  // Auto-scroll when messages change or edit mode changes
  useEffect(() => {
    scrollToBottom();
  }, [allMessages, isEditing]);

  if (isLoading) {
    console.log("⏳ Rendering loading skeleton");
    return <LettersSkeleton />;
  }

  const selectMessage = (messageId) => {
    console.log("🖱️ selectMessage called:", {
      messageId,
      currentlySelected: selectedMessageId,
    });
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

  // NEW: Helper to check if message can be edited
  const canEditMessage = (message) => {
    const isEditable =
      message.status === "pending_review" && message.sent_by?.id === user?.uid;
    console.log("🔍 canEditMessage:", {
      messageId: message.id,
      status: message.status,
      isEditable,
    });
    return isEditable;
  };

  return (
    <div className="bg-gray-100 min-h-screen py-6">
      <div className="max-w-lg mx-auto bg-white shadow-md rounded-lg overflow-hidden flex flex-col h-[90vh]">
        {/* ENHANCED: Header with improved loading indicator */}
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

        {/* NEW: Editing indicator banner */}
        {editingMessageId && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center text-amber-800 text-sm">
              <span className="mr-2">✏️</span>
              <span>Editing message</span>
            </div>
            <button
              onClick={() => {
                console.log("❌ Cancel edit clicked");
                setMessageContent(editingMessageOriginalContent);
                setEditingMessageId(null);
                setEditingMessageOriginalContent("");
                setIsEditing(false);
                setHasDraftContent(false);
              }}
              className="text-amber-600 hover:text-amber-800 text-sm underline">
              Cancel
            </button>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto bg-gray-100">
          {allMessages.map((message, index) => {
            const messageId = message.id;
            const isSelected = selectedMessageId === messageId;
            const isSenderUser = message.sent_by?.id === user?.uid;
            const location = getSenderLocation(message);
            const isEditable = canEditMessage(message);

            const showDateSeparator =
              index === 0 ||
              isDifferentDay(
                allMessages[index - 1]?.created_at,
                message.created_at
              );

            return (
              <div key={messageId}>
                {/* Message */}
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
                          {/* NEW: Status indicator */}
                          {isSenderUser &&
                            message.status === "pending_review" && (
                              <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                                Pending Review
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
                        {isEditable && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log(
                                "✏️ Edit button clicked for message:",
                                message.id
                              );
                              handleEditMessage(message);
                              logButtonEvent(
                                "Edit message clicked!",
                                "/letters/[id]"
                              );
                            }}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                            title="Edit message">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="px-4 pb-3">
                      <div className="ml-16">
                        <p className="text-gray-800 whitespace-pre-wrap">
                          {message.content}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          {!isSenderUser && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log(
                                  "🚨 REPORT MESSAGE CLICKED:",
                                  message.id
                                );
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

        {/* Message Input / View Mode Reply Box */}
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
            // View Mode Input Box
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
            // Edit Mode Input Box
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

        {/* Close Dialog */}
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

        {/* Report Popups */}
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
