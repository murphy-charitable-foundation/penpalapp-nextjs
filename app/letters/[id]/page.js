"use client";

import { useState, useEffect, useRef } from "react";
import { db } from "../../firebaseConfig";
import { collection, doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import BottomNavBar from "@/components/bottom-nav-bar";
import {
  fetchDraft,
  fetchLetterbox,
  fetchRecipients,
  sendLetter,
} from "@/app/utils/letterboxFunctions";
import ProfileImage from "@/components/general/ProfileImage";
import { FaExclamationCircle } from "react-icons/fa";
import ReportPopup from "../../../components/letter/ReportPopup";
import ConfirmReportPopup from "../../../components/letter/ConfirmReportPopup";
import { useRouter } from "next/navigation";
import * as Sentry from "@sentry/nextjs";
import Image from "next/image";

export default function Page({ params }) {
  const { id } = params;
  const auth = getAuth();
  const router = useRouter();
  const messagesEndRef = useRef(null);

  const [messageContent, setMessageContent] = useState("");
  const [user, setUser] = useState(null);
  const [draft, setDraft] = useState(null);
  const [userRef, setUserRef] = useState(null);
  const [allMessages, setAllMessages] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [lettersRef, setLettersRef] = useState(null);
  const [showReportPopup, setShowReportPopup] = useState(false);
  const [showConfirmReportPopup, setShowConfirmReportPopup] = useState(false);
  const [content, setContent] = useState(null);
  const [sender, setSender] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [recipientName, setRecipientName] = useState("");
  const [characterCount, setCharacterCount] = useState(0);
  const [userLocation, setUserLocation] = useState("");
  const [draftTimerId, setDraftTimerId] = useState(null);
  const [isSending, setIsSending] = useState(false);

  // New state for close message dialog
  const [showCloseDialog, setShowCloseDialog] = useState(false);

  const scrollToBottom = (instant = false) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: instant ? "auto" : "smooth",
      block: "end",
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [allMessages]);

  // Function to refresh messages
  const refreshMessages = async () => {
    if (!user || !id) return;

    try {
      console.log("Refreshing messages...");
      const { messages } = await fetchLetterbox(id, 20);

      // Sort messages by creation time (oldest first for display)
      const sortedMessages = messages.sort((a, b) => {
        const aTime =
          a.created_at instanceof Date ? a.created_at : new Date(a.created_at);
        const bTime =
          b.created_at instanceof Date ? b.created_at : new Date(b.created_at);
        return aTime.getTime() - bTime.getTime();
      });

      // Fetch sender information for messages more safely
      const messagesWithSenderInfo = await Promise.all(
        sortedMessages.map(async (message) => {
          if (!message.sent_by) return message;

          // Only fetch sender info for messages not sent by current user
          if (message.sent_by.id !== user.uid) {
            try {
              // Use the recipients data we already have instead of fetching again
              const recipient = recipients.find(
                (r) => r.id === message.sent_by.id
              );
              if (recipient) {
                message.senderLocation = recipient.location || "";
              }
            } catch (error) {
              console.error("Error setting sender location:", error);
              // Don't fail the whole process, just skip location
              message.senderLocation = "";
            }
          }
          return message;
        })
      );

      setAllMessages(messagesWithSenderInfo);
      console.log("Messages refreshed, count:", messagesWithSenderInfo.length);

      // Scroll to bottom after refresh with a delay to ensure DOM is updated
      setTimeout(() => scrollToBottom(true), 300);
    } catch (error) {
      console.error("Error refreshing messages:", error);
    }
  };

  // New function to save draft message to Firestore
  const saveDraftMessage = async (content) => {
    if (!user || !lettersRef || !content.trim()) return;

    try {
      const letterUserRef = userRef ?? doc(db, "users", user.uid);

      // Create draft data
      const draftData = {
        sent_by: letterUserRef,
        content: content,
        status: "draft",
        created_at: new Date(),
        deleted: null,
      };

      // Use existing draft ID or create a new one
      if (draft?.id) {
        await updateDoc(doc(lettersRef, draft.id), draftData);
        console.log("Updated existing draft");
      } else {
        const newDraftRef = doc(lettersRef);
        await setDoc(newDraftRef, draftData);
        setDraft({ ...draftData, id: newDraftRef.id });
        console.log("Created new draft");
      }
    } catch (error) {
      console.error("Error saving draft:", error);
      Sentry.captureException(error);
    }
  };

  // Add debounced draft saving whenever messageContent changes
  useEffect(() => {
    // Clear any existing timer
    if (draftTimerId) {
      clearTimeout(draftTimerId);
    }

    // Only save if there's actually content and user is logged in
    if (messageContent.trim() && user && lettersRef) {
      // Set a new timer to save draft after 1 second of inactivity
      const newTimer = setTimeout(() => {
        saveDraftMessage(messageContent);
      }, 1000);

      setDraftTimerId(newTimer);
    }

    // Cleanup timer when component unmounts
    return () => {
      if (draftTimerId) {
        clearTimeout(draftTimerId);
      }
    };
  }, [messageContent, user, lettersRef]);

  // Enhanced effect to load draft message when first opening the chat
  useEffect(() => {
    if (draft?.content && messageContent === "") {
      setMessageContent(draft.content);
      setCharacterCount(draft.content.length);
    }
  }, [draft]);

  // New function to handle closing the message
  const handleCloseMessage = () => {
    if (messageContent.trim()) {
      // If there's content, show confirmation dialog
      setShowCloseDialog(true);
    } else {
      // If no content, just go back
      router.back();
    }
  };

  // Function to close dialog and navigate back
  const handleConfirmClose = () => {
    // Save as draft before navigating away
    if (messageContent.trim() && user && lettersRef) {
      saveDraftMessage(messageContent);
    }
    router.back();
  };

  // Function to continue editing (close dialog)
  const handleContinueEditing = () => {
    setShowCloseDialog(false);
  };

  const handleSendMessage = async () => {
    if (!messageContent.trim() || !recipients?.length || isSending) {
      if (!messageContent.trim()) alert("Please enter a message");
      return;
    }

    setIsSending(true);

    try {
      const letterUserRef = userRef ?? doc(db, "users", auth.currentUser.uid);

      // Create the message data with "sent" status for final sending
      const letterData = {
        sent_by: letterUserRef,
        content: messageContent.trim(),
        status: "sent",
        created_at: new Date(),
        deleted: null,
      };

      console.log("Sending letter with data:", letterData);
      console.log("Using draft ID:", draft?.id);

      // Use the draft ID if it exists
      const draftId = draft?.id;

      // Send the letter (this will either update existing draft or create new)
      const sentMessage = await sendLetter(letterData, lettersRef, draftId);

      if (sentMessage) {
        console.log("Message sent successfully with ID:", sentMessage.id);

        // Clear the input and draft state FIRST
        setMessageContent("");
        setCharacterCount(0);
        setDraft(null);

        // Wait a moment for Firestore to process the update, then refresh
        setTimeout(async () => {
          await refreshMessages();
        }, 500);
        setSelectedMessageId(null);
      }
    } catch (error) {
      console.error("Error sending message:", {
        message: error.message,
        code: error.code,
        details: error.details,
      });
      Sentry.captureException(error);
      alert(`Failed to send message: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    if (user) {
      const userDocRef = doc(db, "users", user.uid);
      setUserRef(userDocRef);

      // Fetch user location
      const fetchUserData = async () => {
        try {
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.location) {
              setUserLocation(userData.location);
            }
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      };

      fetchUserData();
    }
  }, [user]);

  // Save draft when navigating away
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (messageContent.trim() && user && lettersRef) {
        saveDraftMessage(messageContent);
      }
    };

    // Add event listener for page navigation
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      // Clean up event listener
      window.removeEventListener("beforeunload", handleBeforeUnload);

      // Save draft when component unmounts (navigating away)
      if (messageContent.trim() && user && lettersRef) {
        saveDraftMessage(messageContent);
      }
    };
  }, [messageContent, user, lettersRef]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setIsLoading(true);
      if (currentUser) {
        setUser(currentUser);

        try {
          // First, check if the user is a member of this letterbox
          const letterboxRef = doc(db, "letterbox", id);
          const letterboxDoc = await getDoc(letterboxRef);

          if (!letterboxDoc.exists()) {
            console.error("Letterbox does not exist");
            setIsLoading(false);
            return;
          }

          // Fetch recipients first
          const fetchedRecipients = await fetchRecipients(id);
          setRecipients(fetchedRecipients || []);

          // Set recipient name for header
          if (fetchedRecipients && fetchedRecipients.length > 0) {
            setRecipientName(
              `${fetchedRecipients[0].first_name} ${fetchedRecipients[0].last_name}`
            );
          }

          const lRef = collection(letterboxRef, "letters");
          setLettersRef(lRef);

          // Enhanced draft fetching - load draft if it exists
          const draftData = await fetchDraft(
            id,
            doc(db, "users", currentUser.uid),
            false // Don't create new draft automatically
          );
          setDraft(draftData);

          // Load draft content if it exists
          if (draftData?.content) {
            setMessageContent(draftData.content);
            setCharacterCount(draftData.content.length);
          }

          // Fetch messages after we have recipients data and everything is set up
          await refreshMessages();
        } catch (error) {
          console.error("Initialization error: ", error);
          Sentry.captureException(error);
        } finally {
          setIsLoading(false);
        }
      } else {
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [id]);

  // Move refreshMessages call to after recipients are loaded
  useEffect(() => {
    if (user && recipients.length > 0 && lettersRef) {
      refreshMessages();
    }
  }, [user, recipients, lettersRef]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <div className="text-gray-500">Loading conversation...</div>
      </div>
    );
  }

  const formatTime = (timestamp) => {
    if (!timestamp) return "";

    let date;

    // Handle different timestamp formats
    if (timestamp.toDate && typeof timestamp.toDate === "function") {
      // It's a Firestore Timestamp object
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      // It's already a JavaScript Date object
      date = timestamp;
    } else if (typeof timestamp === "number" || typeof timestamp === "string") {
      // It's a timestamp number or string that can be converted to Date
      date = new Date(timestamp);
    } else {
      // If we can't format it, return empty string
      return "";
    }

    // Format with 12-hour clock and AM/PM
    return date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const selectMessage = (messageId) => {
    setSelectedMessageId(messageId === selectedMessageId ? null : messageId);
  };

  const getMessageId = (message) => message.id;

  // Truncate message to first 30 characters and add ellipsis
  const truncateMessage = (message) => {
    if (message.length <= 30) return message;
    return `${message.substring(0, 30)}...`;
  };

  // Handle message input change
  const handleMessageChange = (e) => {
    setMessageContent(e.target.value);
    setCharacterCount(e.target.value.length);
  };

  // Get location for a message sender
  const getSenderLocation = (message) => {
    const isSenderUser = message.sent_by?.id === userRef?.id;

    if (isSenderUser) {
      return userLocation || "";
    } else {
      // For recipients, use either the fetched location from the message or try to get it from recipients array
      if (message.senderLocation) {
        return message.senderLocation;
      } else if (recipients[0]?.location) {
        return recipients[0].location;
      }
    }

    return "";
  };

  return (
    <div className="bg-gray-100 min-h-screen py-6">
      <div className="max-w-lg mx-auto bg-white shadow-md rounded-lg overflow-hidden flex flex-col h-[90vh]">
        {/* Header bar */}
        <div className="bg-blue-100 p-4 flex items-center justify-between border-b">
          <button onClick={handleCloseMessage} className="text-gray-700">
            ✕
          </button>
          <button
            onClick={handleSendMessage}
            disabled={!messageContent.trim() || isSending}
            className={`p-1 ${
              !messageContent.trim() || isSending
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
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto bg-gray-100">
          {allMessages.map((message) => {
            const messageId = getMessageId(message);
            const isSelected = selectedMessageId === messageId;
            const isSenderUser = message.sent_by?.id === userRef?.id;
            const location = getSenderLocation(message);

            return (
              <div
                key={messageId}
                className={`border-b border-gray-200 ${
                  isSelected ? "bg-white" : "bg-gray-50"
                }`}>
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
                          isSenderUser ? "You" : recipients[0]?.first_name
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
                            setSender(message.sent_by.id);
                            setContent(message.content);
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
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Message input area at the bottom */}
        <div className="bg-white ">
          {messageContent ? (
            // Expanded typing view (Image 2)
            <>
              {/* Recipient header - only show in expanded view */}
              <div className="flex items-center px-4 py-2">
                <Image
                  src="/arrow-left.png"
                  alt="Back"
                  width={20}
                  height={20}
                  className="mr-2"
                />
                <span className="text-gray-700">To {recipientName}</span>
              </div>

              {/* Message text area */}
              <div className="p-4 relative" style={{ height: "50vh" }}>
                <textarea
                  className="w-full h-full p-3 focus:outline-none resize-none text-black bg-white break-words whitespace-pre-wrap"
                  placeholder="Reply to the letter..."
                  value={messageContent}
                  onChange={handleMessageChange}
                  autoFocus
                  wrap="soft"
                  style={{
                    overflowWrap: "break-word",
                    wordWrap: "break-word",
                    height: "calc(100% - 24px)", // Account for padding
                  }}
                />
                <div className="absolute bottom-6 right-6">
                  <Image
                    src="/arrow-right.png"
                    alt="Send"
                    width={20}
                    height={20}
                    className={`cursor-pointer ${
                      (!messageContent.trim() || isSending) && "opacity-50"
                    }`}
                    onClick={
                      messageContent.trim() && !isSending
                        ? handleSendMessage
                        : undefined
                    }
                  />
                </div>
              </div>
            </>
          ) : (
            // Initial view with single reply box (Image 1) - no header
            <div className="p-4">
              <div
                className="border border-cyan-400 rounded p-3 text-gray-500 flex justify-between items-center"
                onClick={() => setMessageContent(" ")} // Set a space to trigger expanded view
              >
                <span className="italic">Reply to the letter...</span>
                <Image
                  src="/arrow-right.png"
                  alt="Send"
                  width={20}
                  height={20}
                />
              </div>
            </div>
          )}
        </div>

        {/* Close message confirmation dialog */}
        {showCloseDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm">
            <div
              className="bg-gray-100 p-6 rounded-2xl shadow-lg w-[345px] h-[245px] mx-auto"
              style={{ fontFamily: "Inter, sans-serif" }}>
              <h2 className="text-xl font-semibold mb-1 text-black leading-tight">
                Close this message, that
                <br />
                you have write?
              </h2>
              <p className="text-gray-600 mb-6 text-sm">
                Are you sure you want to close this message? Unsaved changes
                will be saved as a draft.
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

        {/* Report popups */}
        {showReportPopup && (
          <ReportPopup
            setShowPopup={setShowReportPopup}
            setShowConfirmReportPopup={setShowConfirmReportPopup}
            sender={sender}
            content={content}
          />
        )}
        {showConfirmReportPopup && (
          <ConfirmReportPopup setShowPopup={setShowConfirmReportPopup} />
        )}
      </div>
    </div>
  );
}
