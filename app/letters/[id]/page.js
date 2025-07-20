"use client";

import { useState, useEffect, useRef, useCallback } from "react"; // Added useCallback
import { db } from "../../firebaseConfig";
import {
  collection,
  doc,
  getDoc,
  updateDoc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  fetchDraft,
  fetchLetterbox,
  fetchRecipients,
} from "../../../app/utils/letterboxFunctions";
import ProfileImage from "../../../components/general/ProfileImage";
import { FaExclamationCircle } from "react-icons/fa";
import ReportPopup from "../../../components/letter/ReportPopup";
import ConfirmReportPopup from "../../../components/letter/ConfirmReportPopup";
import { useRouter } from "next/navigation";
import * as Sentry from "@sentry/nextjs";
import FirstTimeChatGuide from "../../../components/tooltip/FirstTimeChatGuide";
import { usePathname } from "next/navigation";
import LettersSkeleton from "../../../components/loading/LettersSkeleton";
import Image from "next/image";

export default function Page({ params }) {
  const { id } = params;
  const auth = getAuth();
  const router = useRouter();
  const messagesEndRef = useRef(null);
  // const textAreaRef = useRef(null); // Ref for textarea to focus
  const textAreaRef = useRef(null); // Ref for textarea to focus

  // User and auth states
  const [user, setUser] = useState(null);
  const [userRef, setUserRef] = useState(null);
  const [userLocation, setUserLocation] = useState("");

  // Message and draft states
  const [messageContent, setMessageContent] = useState(
    "Tap to write letter..."
  );
  const [draft, setDraft] = useState(null);
  const [hasDraftContent, setHasDraftContent] = useState(false);
  const [isDeletingDraft, setIsDeletingDraft] = useState(false); // New state to track draft deletion

  // Chat states
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

  // Enhanced draft save function with better logging
  const saveDraft = useCallback(
    async (content) => {
      console.log(
        "💾 SaveDraft called with content length:",
        content?.length || 0
      );
      console.log("💾 SaveDraft - User exists:", !!user);
      console.log("💾 SaveDraft - User ID:", user?.uid);
      console.log("💾 SaveDraft - LettersRef exists:", !!lettersRef);
      console.log("💾 SaveDraft - LettersRef path:", lettersRef?.path);
      console.log("💾 SaveDraft - Is sending:", isSending);

      if (!user || !lettersRef || isSending) {
        console.log("💾 SaveDraft - Early return due to missing dependencies");
        return;
      }

      try {
        const letterUserRef = userRef || doc(db, "users", user.uid);
        const trimmedContent = content.trim();
        const currentTime = new Date();

        console.log(
          "💾 SaveDraft - Trimmed content length:",
          trimmedContent.length
        );
        console.log("💾 SaveDraft - Existing draft ID:", draft?.id);
        console.log("💾 SaveDraft - Letter user ref path:", letterUserRef.path);

        if (draft?.id) {
          console.log("💾 Updating existing draft with ID:", draft.id);

          // Verify draft document exists
          const draftDocRef = doc(lettersRef, draft.id);
          console.log("💾 Draft document path:", draftDocRef.path);

          const draftDoc = await getDoc(draftDocRef);
          if (!draftDoc.exists()) {
            console.error("💾 Draft document does not exist:", draft.id);
            // Create new draft instead
            console.log(
              "💾 Creating new draft since existing one doesn't exist"
            );
            const draftData = {
              sent_by: letterUserRef,
              content: trimmedContent,
              status: "draft",
              created_at: currentTime,
              updated_at: currentTime,
              deleted: null,
              unread: true,
            };

            const newDraftRef = doc(lettersRef);
            await setDoc(newDraftRef, draftData);
            setDraft({ ...draftData, id: newDraftRef.id });
            console.log("💾 New draft created with ID:", newDraftRef.id);
          } else {
            // Update existing draft (even if content is empty - this handles requirement 2.5)
            const draftData = {
              sent_by: letterUserRef,
              content: trimmedContent, // Can be empty string
              status: "draft",
              created_at: draft.created_at,
              updated_at: currentTime,
              deleted: null,
              unread: true,
            };

            await updateDoc(draftDocRef, draftData);
            setDraft({ ...draftData, id: draft.id });
            console.log(
              "💾 Draft updated successfully with content:",
              trimmedContent ? "has content" : "empty"
            );
          }
        } else if (trimmedContent) {
          console.log("💾 Creating new draft");
          // Create new draft only if there's content
          const draftData = {
            sent_by: letterUserRef,
            content: trimmedContent,
            status: "draft",
            created_at: currentTime,
            updated_at: currentTime,
            deleted: null,
            unread: true,
          };

          const newDraftRef = doc(lettersRef);
          console.log("💾 New draft ref path:", newDraftRef.path);
          await setDoc(newDraftRef, draftData);
          setDraft({ ...draftData, id: newDraftRef.id });
          console.log("💾 New draft created with ID:", newDraftRef.id);
        } else {
          console.log("💾 No content and no existing draft - nothing to save");
        }

        // Update UI state
        const hasContent = Boolean(trimmedContent);
        console.log("💾 Setting hasDraftContent to:", hasContent);
        setHasDraftContent(hasContent);

        // If content is empty, exit edit mode (requirement 2.5)
        if (!hasContent) {
          console.log("💾 No content - exiting edit mode");
          setIsEditing(false);
        }
      } catch (error) {
        console.error("💾 Error saving draft:", error);
        console.error("💾 Error code:", error.code);
        console.error("💾 Error details:", error.message);
        console.error("💾 Full error object:", error);

        // More specific error handling for drafts
        if (error.code === "permission-denied") {
          console.error("💾 Permission denied when saving draft");
        } else if (error.code === "unauthenticated") {
          console.error("💾 User not authenticated when saving draft");
        }
      }
    },
    [user, lettersRef, isSending, draft, userRef]
  );

  // Enhanced message change handler with automatic mode switching and immediate draft saving
  const handleMessageChange = async (e) => {
    const newContent = e.target.value;
    console.log("✏️ Message content changed, new length:", newContent.length);

    setMessageContent(newContent);
    const trimmedContent = newContent.trim();

    console.log("✏️ Trimmed content length:", trimmedContent.length);

    // Clear any existing timer
    if (draftTimer) {
      clearTimeout(draftTimer);
      setDraftTimer(null);
    }

    // Update UI state based on content
    if (trimmedContent.length > 0) {
      console.log("✏️ Content exists - entering edit mode");
      setIsEditing(true);
      setHasDraftContent(true);

      // Auto-save draft after 1 second of no typing (debounced)
      const timer = setTimeout(async () => {
        console.log("✏️ Auto-saving draft after typing pause");
        await saveDraft(newContent);
      }, 1000);
      setDraftTimer(timer);
    } else {
      console.log(
        "✏️ No content - exiting edit mode and saving empty draft IMMEDIATELY (requirement 2.5)"
      );
      setIsEditing(false);
      setHasDraftContent(false);

      // IMMEDIATELY and SYNCHRONOUSLY save empty draft if we had a draft before (requirement 2.5)
      if (draft?.id) {
        console.log(
          "✏️ IMMEDIATELY saving empty draft to clear existing draft - this must complete NOW"
        );
        // Save immediately without setTimeout to ensure it completes before any navigation
        try {
          await saveDraft(newContent);
          console.log("✏️ Empty draft save completed successfully");
        } catch (error) {
          console.error("✏️ Failed to save empty draft:", error);
        }
      }
    }
  };

  // Enhanced send message function
  const handleSendMessage = async () => {
    console.log("📤 Send message initiated");
    const trimmedContent = messageContent.trim();

    if (!trimmedContent) {
      console.log("📤 Send failed - no content");
      alert("Please enter a message");
      return;
    }

    if (isSending) {
      console.log("📤 Send failed - already sending");
      return;
    }

    console.log("📤 Starting send process");
    console.log("📤 User:", user?.uid);
    console.log("📤 LettersRef exists:", !!lettersRef);
    console.log("📤 UserRef exists:", !!userRef);

    setIsSending(true);

    try {
      // Validate required dependencies
      if (!user || !lettersRef) {
        throw new Error("Missing required dependencies: user or lettersRef");
      }

      const letterUserRef = userRef || doc(db, "users", user.uid);
      const currentTime = new Date();

      console.log("📤 Letter user ref path:", letterUserRef.path);

      const messageData = {
        sent_by: letterUserRef,
        content: trimmedContent,
        status: "sent",
        created_at: currentTime,
        deleted: null,
        unread: true,
      };

      console.log("📤 Message data prepared:", {
        content: trimmedContent,
        status: messageData.status,
        sent_by_path: letterUserRef.path,
        created_at: currentTime.toISOString(),
      });

      let messageRef;

      if (draft?.id) {
        console.log("📤 Converting draft to sent message, draft ID:", draft.id);
        console.log(
          "📤 Draft document path:",
          lettersRef.path + "/" + draft.id
        );
        // Update existing draft to sent
        messageRef = doc(lettersRef, draft.id);

        // Verify draft document exists before updating
        const draftDoc = await getDoc(messageRef);
        if (!draftDoc.exists()) {
          console.error("📤 Draft document does not exist:", draft.id);
          throw new Error("Draft document not found");
        }

        await updateDoc(messageRef, messageData);
        console.log("📤 Draft successfully converted to sent message");
      } else {
        console.log("📤 Creating new message via draft-then-send workflow");
        console.log("📤 Letters collection path:", lettersRef.path);

        // STEP 1: Create as draft first (required by security rules)
        const draftData = {
          sent_by: letterUserRef,
          content: trimmedContent,
          status: "draft", // Create as draft first
          created_at: currentTime,
          deleted: null,
          unread: true,
        };

        messageRef = doc(lettersRef);
        console.log("📤 Creating draft first at path:", messageRef.path);
        await setDoc(messageRef, draftData);
        console.log("📤 Draft created successfully");

        // STEP 2: Immediately update to sent status
        console.log("📤 Converting draft to sent message");
        await updateDoc(messageRef, messageData);
        console.log(
          "📤 Message successfully sent via draft-then-send workflow"
        );
      }

      console.log("📤 Message sent successfully with ID:", messageRef.id);

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
      setAllMessages((prev) => [...prev, messageWithId]);

      // Scroll to bottom
      setTimeout(() => scrollToBottom(true), 100);
    } catch (error) {
      console.error("📤 Error sending message:", error);
      console.error("📤 Error code:", error.code);
      console.error("📤 Error details:", error.message);
      console.error("📤 Full error object:", error);

      // More specific error handling
      if (error.code === "permission-denied") {
        alert(
          "Permission denied. Please check your access rights to this conversation."
        );
      } else if (error.code === "unauthenticated") {
        alert("You are not authenticated. Please log in again.");
      } else if (
        error.message.includes("Missing or insufficient permissions")
      ) {
        alert(
          "Insufficient permissions to send message. Please contact support."
        );
      } else {
        alert("Failed to send message. Please try again.");
      }
    } finally {
      console.log("📤 Send process completed, setting isSending to false");
      setIsSending(false);
    }
  };

  // Enhanced close message handler
  const handleCloseMessage = async () => {
    console.log("❌ Close message initiated");
    const trimmedMessageContent = messageContent.trim();
    console.log(
      "❌ Current message content length:",
      trimmedMessageContent.length
    );

    // CRITICAL: If content is empty but we have a draft, save empty draft immediately before checking dialog
    if (trimmedMessageContent.length === 0 && draft?.id) {
      console.log(
        "❌ Content is empty but draft exists - saving empty draft before close"
      );
      try {
        await saveDraft(messageContent);
        console.log("❌ Empty draft saved successfully before close");
      } catch (error) {
        console.error("❌ Failed to save empty draft before close:", error);
      }
    }

    // Only show dialog if there's content to save (requirement 2)
    if (trimmedMessageContent.length > 0) {
      console.log("❌ Content exists - showing close dialog");
      setShowCloseDialog(true);
    } else {
      console.log("❌ No content - closing directly");
      router.back();
    }
  };

  // Enhanced confirm close handler
  const handleConfirmClose = async () => {
    console.log("✅ Confirm close initiated");
    const trimmedContent = messageContent.trim();
    console.log("✅ Content to save length:", trimmedContent.length);

    // Save draft before closing if there's content OR if we're updating an existing draft to empty
    if (trimmedContent || draft?.id) {
      console.log("✅ Saving draft before closing");
      await saveDraft(messageContent); // Use original content, not trimmed, to handle empty case
    }

    console.log("✅ Closing dialog and navigating back");
    setShowCloseDialog(false);
    // Add a small delay to allow Firestore to process the deletion before navigation
    setTimeout(() => router.back(), 50);
  };

  // Continue editing
  const handleContinueEditing = () => {
    console.log("📝 Continue editing selected");
    setShowCloseDialog(false);
    setIsEditing(true);
    textAreaRef.current?.focus();
  };

  // Handle report button click for the user (not a specific message)
  const handleReportUserClick = () => {
    console.log("🚨 Report user clicked");
    if (recipients.length > 0) {
      setReportSender(recipients[0].id);
      setReportContent("General report about user behavior");
      setShowReportPopup(true);
    }
  };

  // Load messages
  const loadMessages = async () => {
    console.log("📨 Loading messages");
    if (!user || !id || !recipients.length) {
      console.log("📨 Cannot load messages - missing dependencies");
      return;
    }

    try {
      console.log("📨 Fetching letterbox messages");
      const { messages } = await fetchLetterbox(id, 20);

      const sortedMessages = messages.sort((a, b) => {
        const aTime =
          a.created_at instanceof Date ? a.created_at : new Date(a.created_at);
        const bTime =
          b.created_at instanceof Date ? b.created_at : new Date(b.created_at);
        return aTime.getTime() - bTime.getTime();
      });

      console.log("📨 Processing", sortedMessages.length, "messages");

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
      console.log("📨 Messages loaded successfully");
      setTimeout(() => scrollToBottom(true), 300);
    } catch (error) {
      console.error("📨 Error loading messages:", error);
    }
  };

  // Initialize component
  useEffect(() => {
    console.log("🚀 Component initializing");
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log("🔐 Auth state changed, user exists:", !!currentUser);
      setIsLoading(true);

      if (!currentUser) {
        console.log("🔐 No user - redirecting to login");
        router.push("/login");
        return;
      }

      setUser(currentUser);

      try {
        console.log("📪 Checking letterbox exists for ID:", id);
        // Check letterbox exists
        const letterboxRef = doc(db, "letterbox", id);
        const letterboxDoc = await getDoc(letterboxRef);

        if (!letterboxDoc.exists()) {
          console.error("📪 Letterbox does not exist");
          setIsLoading(false);
          return;
        }

        console.log("📪 Letterbox exists, setting up user data");
        // Set user ref and fetch user data
        const userDocRef = doc(db, "users", currentUser.uid);
        setUserRef(userDocRef);

        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists() && userDoc.data().location) {
          const location = userDoc.data().location;
          console.log("📍 User location set:", location);
          setUserLocation(location);
        }

        console.log("👥 Fetching recipients");
        // Fetch recipients
        const fetchedRecipients = await fetchRecipients(id);
        setRecipients(fetchedRecipients || []);
        console.log("👥 Recipients fetched:", fetchedRecipients?.length || 0);

        if (fetchedRecipients?.length > 0) {
          const recipientName = `${fetchedRecipients[0].first_name} ${fetchedRecipients[0].last_name}`;
          console.log("👥 Recipient name set:", recipientName);
          setRecipientName(recipientName);
        }

        // Set letters ref
        const lRef = collection(letterboxRef, "letters");
        setLettersRef(lRef);
        console.log("📝 Letters reference set");

        console.log("📋 Fetching existing draft");
        // Fetch existing draft
        const draftData = await fetchDraft(id, userDocRef, false);
        console.log("📋 Draft data received:", draftData ? "exists" : "none");

        if (draftData?.status === "draft") {
          console.log("📋 Processing existing draft");
          setDraft(draftData);
          const draftContent = draftData.content || "";
          const hasContent = Boolean(draftContent.trim());

          console.log("📋 Draft content length:", draftContent.length);
          console.log("📋 Draft has content:", hasContent);

          setMessageContent(draftContent);
          setHasDraftContent(hasContent);

          // Only enter edit mode if draft has actual content
          // If draft is empty (requirement 2.5), stay in view mode so user feels like there's no draft
          if (hasContent) {
            console.log("📋 Draft has content - entering edit mode");
            setIsEditing(true);
            setTimeout(() => {
              textAreaRef.current?.focus();
              textAreaRef.current?.setSelectionRange(
                textAreaRef.current.value.length,
                textAreaRef.current.value.length
              );
            }, 0);
          } else {
            console.log(
              "📋 Draft is empty - staying in view mode (user should feel like no draft exists)"
            );
            setIsEditing(false);
          }
        } else {
          console.log("📋 No draft found - initializing empty state");
          // No draft found
          setIsEditing(false);
          setMessageContent("");
          setDraft(null);
          setHasDraftContent(false);
        }

        // Load messages if we have recipients
        if (fetchedRecipients?.length > 0) {
          console.log("📨 Loading messages with recipients");
          const { messages } = await fetchLetterbox(id, 20);

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
                if (message?.unread) {
                  await updateDoc(doc(lRef, message.id), { unread: false });
                }
              }
              return message;
            })
          );

          setAllMessages(messagesWithSenderInfo);
          console.log(
            "📨 Initial messages loaded:",
            messagesWithSenderInfo.length
          );
        }
      } catch (error) {
        console.error("🚀 Initialization error:", error);
        console.error("🚀 Error details:", error.message);
      } finally {
        console.log("🚀 Initialization complete");
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [id]); // Added saveDraft to dependencies to ensure effect re-runs if saveDraft changes

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
    console.log(
      "📜 Auto-scroll triggered - messages:",
      allMessages.length,
      "isEditing:",
      isEditing
    );
    scrollToBottom();
  }, [allMessages, isEditing]);

  if (isLoading) {
    console.log("⏳ Showing loading screen");
    return <LettersSkeleton />;
  }

  const selectMessage = (messageId) => {
    console.log("👆 Message selected:", messageId);
    setSelectedMessageId(messageId === selectedMessageId ? null : messageId);
    setIsEditing(false); // Exit edit mode when selecting a message
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
    console.log(
      "🚀 Can send message:",
      canSend,
      "- content length:",
      messageContent.trim().length,
      "- is sending:",
      isSending
    );
    return canSend;
  };

  // Enhanced function to handle switching to edit mode from view mode
  const handleReplyClick = () => {
    console.log("💬 Reply clicked - switching to edit mode");
    console.log("💬 Current draft exists:", !!draft?.id);
    console.log("💬 Current message content:", messageContent);

    setIsEditing(true);

    // If we have an empty draft, the user should feel like they're starting fresh
    // but when they start typing, it will update the existing empty draft
    console.log(
      "💬 User starting to reply, ready to update draft when they type"
    );

    // Ensure focus immediately after switching to edit mode
    setTimeout(() => {
      console.log("💬 Focusing textarea after reply click");
      textAreaRef.current?.focus();
    }, 0);
  };

  console.log(
    "🎨 Rendering component - isEditing:",
    isEditing,
    "messageContent length:",
    messageContent.length
  );

  return (
    <div className="bg-gray-100 min-h-screen py-6">
      <div className="max-w-lg mx-auto bg-white shadow-md rounded-lg overflow-hidden flex flex-col h-[90vh]">
        {/* Header */}
        <div className="bg-blue-100 p-4 flex items-center justify-between border-b">
          <button onClick={handleCloseMessage} className="text-gray-700">
            ✕
          </button>
          {isEditing && ( // Only show send button in edit mode
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
                alt="Send message"
                width={24}
                height={24}
                className="object-contain"
              />
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto bg-gray-100">
          {allMessages.map((message, index) => {
            const messageId = message.id;
            const isSelected = selectedMessageId === messageId;
            const isSenderUser = message.sent_by?.id === user?.uid;
            const location = getSenderLocation(message);

            // Check if we need to show a date separator (already in DateHelpers)
            const showDateSeparator =
              index === 0 ||
              isDifferentDay(
                allMessages[index - 1]?.created_at,
                message.created_at
              );

            return (
              <div key={messageId}>
                {/* Date Separator */}
                {/* {showDateSeparator && (
                  <div className="flex items-center my-4 px-4">
                    <div className="flex-1 border-t border-gray-300"></div>
                    <div className="px-3 py-1 bg-gray-200 text-gray-600 text-xs rounded-full">
                      {formatDateSeparator(message.created_at)}
                    </div>
                    <div className="flex-1 border-t border-gray-300"></div>
                  </div>
                )} */}

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
                              ? user?.photoURL
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
                      <div className="text-gray-500 text-sm">
                        {formatTime(message.created_at)}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="px-4 pb-3">
                      <div className="ml-16">
                        <p className="text-gray-800 whitespace-pre-wrap">
                          {message.content}
                        </p>
                        {!isSenderUser && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setReportSender(message.sent_by.id);
                              setReportContent(message.content);
                              setShowReportPopup(true);
                            }}
                            className="mt-2 text-xs text-gray-500 hover:text-gray-700 flex items-center">
                            <FaExclamationCircle className="mr-1" size={10} />
                            Report
                          </button>
                        )}
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
            {/* Octagonal Report Button */}
            {/* <button
              onClick={handleReportUserClick}
              className="w-8 h-8 hover:opacity-80 transition-opacity duration-200 flex items-center justify-center"
              title="Report user">
              <Image
                src="/Vector.svg"
                alt="Report"
                width={32}
                height={32}
                className="object-contain"
              />
            </button> */}
          </div>

          {!isEditing ? (
            // View Mode Input Box
            <div className="p-4">
              <div
                className="w-full p-3 border border-cyan-500 rounded-md text-gray-500 cursor-text"
                onClick={handleReplyClick}>
                Reply to the letter...
              </div>
            </div>
          ) : (
            // Edit Mode Input Box
            <div className="p-4 relative" style={{ height: "40vh" }}>
              <textarea
                ref={textAreaRef} // Attach ref to textarea
                className="w-full h-full p-3 focus:outline-none resize-none text-black bg-white"
                placeholder="Write your message..."
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
                Close this message?
              </h2>
              <p className="text-gray-600 mb-6 text-sm">
                Your message will be saved as a draft.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={handleContinueEditing}
                  className="flex-1 bg-[#4E802A] text-white py-3 px-4 rounded-2xl hover:bg-opacity-90 transition-colors">
                  Continue
                </button>
                <button
                  onClick={handleConfirmClose}
                  className="flex-1 bg-gray-200 text-[#4E802A] py-3 px-4 rounded-2xl hover:bg-gray-300 transition-colors">
                  Close
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
