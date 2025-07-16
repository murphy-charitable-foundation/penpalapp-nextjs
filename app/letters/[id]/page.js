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
import BottomNavBar from "@/components/bottom-nav-bar";
import {
  fetchDraft,
  fetchLetterbox,
  fetchRecipients,
} from "@/app/utils/letterboxFunctions";
import ProfileImage from "@/components/general/ProfileImage";
import { FaExclamationCircle } from "react-icons/fa";
import ReportPopup from "../../../components/letter/ReportPopup";
import ConfirmReportPopup from "../../../components/letter/ConfirmReportPopup";
import { useRouter } from "next/navigation";
import * as Sentry from "@sentry/nextjs";
import {
  isDifferentDay,
  formatDateSeparator,
  formatTime,
} from "@/components/letter/DateHelpers";
import Image from "next/image";

export default function Page({ params }) {
  const { id } = params;
  const auth = getAuth();
  const router = useRouter();
  const messagesEndRef = useRef(null);
  const textAreaRef = useRef(null); // Ref for textarea to focus

  // User and auth states
  const [user, setUser] = useState(null);
  const [userRef, setUserRef] = useState(null);
  const [userLocation, setUserLocation] = useState("");

  // Message and draft states
  const [messageContent, setMessageContent] = useState("");
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
    messagesEndRef.current?.scrollIntoView({
      behavior: instant ? "auto" : "smooth",
      block: "end",
    });
  };

  // Auto-save draft function
  // Wrapped in useCallback to prevent re-creation on every render
  const saveDraft = useCallback(
    async (content) => {
      if (!user || !lettersRef || isSending || isDeletingDraft) return; // Prevent concurrent operations

      try {
        const letterUserRef = userRef || doc(db, "users", user.uid);
        const trimmedContent = content.trim();

        // If content is empty, delete existing draft
        if (!trimmedContent) {
          if (draft?.id) {
            setIsDeletingDraft(true); // Indicate that deletion is in progress
            await deleteDoc(doc(lettersRef, draft.id));
            console.log("Draft deleted from Firestore."); // For debugging
            setDraft(null);
          }
          setHasDraftContent(false);
          setIsEditing(false); // Crucial: Exit edit mode if draft is cleared
          setMessageContent(""); // Ensure messageContent is truly empty
          setIsDeletingDraft(false); // Reset deletion state
          return;
        }

        // If there's content, proceed to save/update draft
        const currentTime = new Date();
        const draftData = {
          sent_by: letterUserRef,
          content: trimmedContent,
          status: "draft",
          created_at: draft?.created_at || currentTime,
          updated_at: currentTime,
          deleted: null,
        };

        if (draft?.id) {
          // Update existing draft
          await updateDoc(doc(lettersRef, draft.id), draftData);
          setDraft({ ...draftData, id: draft.id });
          console.log("Draft updated in Firestore."); // For debugging
        } else {
          // Create new draft
          const newDraftRef = doc(lettersRef);
          await setDoc(newDraftRef, draftData);
          setDraft({ ...draftData, id: newDraftRef.id });
          console.log("New draft created in Firestore."); // For debugging
        }
        setHasDraftContent(true);
        setIsEditing(true); // Ensure in edit mode if there's content
      } catch (error) {
        console.error("Error saving draft:", error);
      } finally {
        setIsDeletingDraft(false); // Always reset deletion state
      }
    },
    [user, lettersRef, isSending, draft, userRef, isDeletingDraft]
  ); // Added isDeletingDraft to dependencies

  // Handle message content change
  const handleMessageChange = async (e) => {
    const newContent = e.target.value;
    setMessageContent(newContent);
    const trimmedContent = newContent.trim();
    setHasDraftContent(trimmedContent.length > 0);

    // Enter edit mode immediately when typing starts
    if (!isEditing && trimmedContent.length > 0) {
      setIsEditing(true);
    }
    // Exit edit mode immediately when content becomes empty
    // And ensure draft is cleared by awaiting saveDraft
    if (isEditing && trimmedContent.length === 0) {
      setIsEditing(false);
      setHasDraftContent(false);

      if (draftTimer) {
        clearTimeout(draftTimer);
        setDraftTimer(null);
      }
      await saveDraft(""); // Await the deletion
      return;
    }

    // Clear existing timer
    if (draftTimer) {
      clearTimeout(draftTimer);
    }

    // Set new timer to save draft after 2 seconds only if content is not empty
    if (trimmedContent.length > 0) {
      const timer = setTimeout(() => {
        saveDraft(newContent);
      }, 2000);
      setDraftTimer(timer);
    } else {
      // If content is empty, ensure the draft is cleared quickly and no timer is pending

      setDraftTimer(null);
    }
  };

  // Send message function
  const handleSendMessage = async () => {
    const trimmedContent = messageContent.trim();

    if (!trimmedContent && !draft?.content?.trim()) {
      alert("Please enter a message");
      return;
    }

    if (isSending) return;

    setIsSending(true);

    try {
      // Clear draft timer
      if (draftTimer) {
        clearTimeout(draftTimer);
        setDraftTimer(null);
      }

      const letterUserRef = userRef || doc(db, "users", user.uid);
      const contentToSend = trimmedContent || draft?.content?.trim();
      const currentTime = new Date();

      const messageData = {
        sent_by: letterUserRef,
        content: contentToSend,
        status: "sent",
        created_at: currentTime,
        deleted: null,
        unread: true,
      };

      let messageRef;

      if (draft?.id) {
        // Update existing draft to sent
        messageRef = doc(lettersRef, draft.id);
        await updateDoc(messageRef, messageData);
      } else {
        // Create new message
        messageRef = doc(lettersRef);
        await setDoc(messageRef, messageData);
      }

      // Verify message was sent
      const sentDoc = await getDoc(messageRef);
      if (!sentDoc.exists() || sentDoc.data().status !== "sent") {
        throw new Error("Message failed to send");
      }

      // Clear states
      setMessageContent("");
      setDraft(null);
      setHasDraftContent(false);
      setIsEditing(false); // Exit edit mode after sending

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
      console.error("Error sending message:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  // Handle close button
  const handleCloseMessage = async () => {
    const trimmedMessageContent = messageContent.trim();

    console.log("This is what is going to be saved:");
    console.log(trimmedMessageContent);
    // if (isEditing && trimmedMessageContent.length > 0) {
    //   setShowCloseDialog(true);
    // } else {
    // If there's unsent content or an active draft
    if (trimmedMessageContent.length > 0 || draft?.content?.trim().length > 0) {
      setShowCloseDialog(true);
    } else {
      // If content is empty AND no active draft, ensure draft is cleared then go back
      if (draft?.id) {
        // Await deletion before navigating back
        await saveDraft("");
      }
      // Add a small delay to allow Firestore to process the deletion before navigation
      setTimeout(() => router.back(), 50);
    }
  };

  // Confirm close and save draft
  const handleConfirmClose = async () => {
    const trimmedContent = messageContent.trim();

    if (trimmedContent.length > 0) {
      await saveDraft(trimmedContent);
    } else {
      if (draft?.id) {
        await saveDraft(""); // Ensure draft is cleared if user confirms close with empty content
      }
    }
    setShowCloseDialog(false);
    // Add a small delay to allow Firestore to process the deletion before navigation
    setTimeout(() => router.back(), 50);
  };

  // Continue editing
  const handleContinueEditing = () => {
    setShowCloseDialog(false);
    setIsEditing(true); // Ensure we stay in edit mode
    textAreaRef.current?.focus(); // Focus the textarea
  };

  // Handle report button click for the user (not a specific message)
  const handleReportUserClick = () => {
    if (recipients.length > 0) {
      setReportSender(recipients[0].id);
      setReportContent("General report about user behavior");
      setShowReportPopup(true);
    }
  };

  // Load messages
  const loadMessages = async () => {
    if (!user || !id || !recipients.length) return;

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
      setTimeout(() => scrollToBottom(true), 300);
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  // Initialize component
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setIsLoading(true);

      if (!currentUser) {
        router.push("/login");
        return;
      }

      setUser(currentUser);

      try {
        // Check letterbox exists
        const letterboxRef = doc(db, "letterbox", id);
        const letterboxDoc = await getDoc(letterboxRef);

        if (!letterboxDoc.exists()) {
          console.error("Letterbox does not exist");
          setIsLoading(false);
          return;
        }

        // Set user ref and fetch user data
        const userDocRef = doc(db, "users", currentUser.uid);
        setUserRef(userDocRef);

        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists() && userDoc.data().location) {
          setUserLocation(userDoc.data().location);
        }

        // Fetch recipients
        const fetchedRecipients = await fetchRecipients(id);
        setRecipients(fetchedRecipients || []);

        if (fetchedRecipients?.length > 0) {
          setRecipientName(
            `${fetchedRecipients[0].first_name} ${fetchedRecipients[0].last_name}`
          );
        }

        // Set letters ref
        const lRef = collection(letterboxRef, "letters");
        setLettersRef(lRef);

        // Fetch existing draft
        const draftData = await fetchDraft(id, userDocRef, false);
        if (draftData?.status === "draft") {
          setDraft(draftData);
          setMessageContent(draftData.content || "");
          const hasContent = Boolean(draftData.content?.trim());
          setHasDraftContent(hasContent);
          setIsEditing(hasContent); // Set edit mode if draft exists AND has content
          if (hasContent) {
            // If there's draft content, focus the textarea after render
            setTimeout(() => {
              textAreaRef.current?.focus();
              // Place cursor at the end of the text
              textAreaRef.current?.setSelectionRange(
                textAreaRef.current.value.length,
                textAreaRef.current.value.length
              );
            }, 0);
          }
        } else {
          // No draft found, ensure states are reset to reflect view mode
          setIsEditing(false);
          setMessageContent("");
          setDraft(null);
          setHasDraftContent(false);
        }

        // Load messages if we have recipients
        if (fetchedRecipients?.length > 0) {
          const { messages } = await fetchLetterbox(id, 20);

          const sortedMessages = messages.sort((a, b) => {
            const aTime =
              a.created_at instanceof Date
                ? a.created_at
                : new Date(a.created_at);
            const bTime =
              b.created_at instanceof Date
                ? b.created_at
                : new Date(b.created_at);
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
        console.error("Initialization error:", error);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [id]); // Added saveDraft to dependencies to ensure effect re-runs if saveDraft changes

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
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <div className="text-gray-500">Loading conversation...</div>
      </div>
    );
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
    return (
      (messageContent.trim().length > 0 || draft?.content?.trim().length > 0) &&
      !isSending
    );
  };

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
                onClick={() => {
                  setIsEditing(true);
                  // Ensure focus immediately after switching to edit mode
                  setTimeout(() => textAreaRef.current?.focus(), 0);
                }}>
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
