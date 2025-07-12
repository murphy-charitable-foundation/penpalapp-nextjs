"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
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
import { RiDeleteBin6Line } from "react-icons/ri";
import { MdSend } from "react-icons/md";
import { BsPaperclip } from "react-icons/bs";
import { IoMdClose } from "react-icons/io";
import { MdInsertDriveFile } from "react-icons/md";
import { FaExclamationCircle } from "react-icons/fa";
import ReportPopup from "../../../components/general/letter/ReportPopup";
import ConfirmReportPopup from "../../../components/general/letter/ConfirmReportPopup";
import Button from "../../../components/general/Button";
import TextArea from "../../../components/general/TextArea";
import Input from "../../../components/general/Input";

import { useRouter } from "next/navigation";
import * as Sentry from "@sentry/nextjs";
import FirstTimeChatGuide from "@/components/tooltip/FirstTimeChatGuide";
import { usePathname } from 'next/navigation';

import LettersSkeleton from "../../../components/loading/LettersSkeleton";
import { uploadFile } from "../../lib/uploadFile";
import {
  fetchDraft,
  fetchLetterbox,
  fetchRecipients,
  sendLetter,
} from "../../utils/letterboxFunctions";

import BottomNavBar from "../../../components/bottom-nav-bar";
import ProfileImage from "../../../components/general/ProfileImage";
import LetterHeader from "../../../components/general/letter/LetterHeader";
import RecipientList from "../../../components/general/letter/RecipientList";
import MessageBubble from "../../../components/general/letter/MessageBubble";
import { PageContainer } from "../../../components/general/PageContainer";
import { BackButton } from "../../../components/general/BackButton";
import Dialog from "../../../components/general/Modal";

export default function Page({ params }) {
  const { id } = params;
  const auth = getAuth();
  const router = useRouter();
  const messagesEndRef = useRef(null);

  const [letterContent, setLetterContent] = useState("Tap to write letter...");
  const messageInputRef = useRef(null);
  const [user, setUser] = useState(null);
  const [userRef, setUserRef] = useState(null);
  const [userLocation, setUserLocation] = useState("");
  const pathname = usePathname();

  // Message and draft states
  const [messageContent, setMessageContent] = useState("Tap to write letter...");
  const [draft, setDraft] = useState(null);
  const [hasDraftContent, setHasDraftContent] = useState(false);

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

  // Report states
  const [showReportPopup, setShowReportPopup] = useState(false);
  const [showConfirmReportPopup, setShowConfirmReportPopup] = useState(false);

  const [content, setContent] = useState(null);
  const [sender, setSender] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const [dialogTitle, setDialogTitle] = useState("");

  const PAGINATION_INCREMENT = 20;
  const handleSendLetter = async () => {
    if (!letterContent.trim() || !recipients?.length) {
      setIsDialogOpen(true);
      setDialogTitle("Oops!");
      setDialogMessage(
        "Please fill in the letter content and select a recipient."
      );
      return;
    }

    if (!auth.currentUser) {
      setIsDialogOpen(true);
      setDialogTitle("Oops!");
      setDialogMessage("Sender not identified, please log in.");

      return;
    }
    const letterUserRef = userRef ?? doc(db, "users", auth.currentUser.uid); // TODO: make population of userRef blocking and cached to be available throughout the call
    const letterData = {
      content: letterContent,
      sent_by: letterUserRef,
      status: "sent",
      created_at: new Date(),
      deleted: null,
    };
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
  const handleCloseMessage = () => {
    const hasContent = messageContent.trim().length > 0;

    if (hasContent) {
      setShowCloseDialog(true);
    } else {
      Sentry.captureException(e);
      setIsDialogOpen(true);
      setDialogTitle("Oops!");
      setDialogMessage("Failed to send your letter, please try again.");
    }
  };

  const { messages, lastVisible: newLastVisible } = await fetchLetterbox(
    id,
    PAGINATION_INCREMENT
  );
  if( messages) {
    setAllMessages(messages);
    setLastVisible(newLastVisible);
    setDraft(null);
    const d = await fetchDraft(id, userRef, true);
    setDraft(d);
    setLetterContent(d.content);
  };

  useEffect(() => {
    if (user) {
      const userDocRef = doc(db, "users", user.uid);
      setUserRef(userDocRef);
      const fetchMessages = async () => {
        const { messages, lastVisible: newLastVisible } = await fetchLetterbox(
          id,
          5
        );
        setAllMessages(messages);
        setLastVisible(newLastVisible); // Store last visible letter for pagination
        setHasMoreMessages(messages.length === PAGINATION_INCREMENT); // Assuming 10 is the page limit
        if( messages.length > 0 ) {
          setIsLoading(false);
        }
      };
      fetchMessages();
    }
    
  }, [user]);

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
          setHasDraftContent(Boolean(draftData.content?.trim()));
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
    };
    getSelectedUser();
    
  }, [recipients]);

  // Cleanup timer on unmount
  useEffect(() => {
    setDebounce(debounce + 1);
    const updateDraft = async () => {
      if (userRef && lettersRef) {
        const letterData = {
          content: letterContent,
          sent_by: userRef,
          created_at: new Date(),
          deleted: null,
          status: "draft",
          attachments,
        };
        await sendLetter(letterData, lettersRef, draft.id);
      }
    };
    if (debounce >= 20) {
      updateDraft();
      setDebounce(0);
    }
  }, [letterContent]);

  const handleLoadMore = async () => {
    setLoadingMore(true); // Set loading state to true while fetching more messages
    const { messages, lastVisible: newLastVisible } = await fetchLetterbox(
      id,
      PAGINATION_INCREMENT,
      lastVisible
    );
    setAllMessages((prevMessages) => [...prevMessages, ...messages]);
    setLastVisible(newLastVisible); // Update lastVisible with the new last document
    setHasMoreMessages(messages.length === PAGINATION_INCREMENT); // If fewer than 10 messages are returned, no more messages to load
    setLoadingMore(false); // Reset loading state
  };

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


  const handleUpload = async (file) => {
    uploadFile(
      file,
      `uploads/letterbox/${id}/${file.name}`,
      setUploadProgress,
      (error) => console.error("Upload error:", error),
      onUploadComplete
    );
  };

  const FileModal = () => (
    <div className="fixed inset-0 flex justify-center items-center z-50 bg-black bg-opacity-40">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full h-[90%]">
        <div className="flex relative">
          <Button
            btnText=""
            color="bg-transparent"
            textColor="text-gray-600"
            hoverColor="hover:bg-gray-100"
            rounded="rounded-full"
            size="w-8 h-8"
            onClick={() => setIsFileModalOpen(false)}
          >
            <IoMdClose className="h-full w-full" />
          </Button>
          <h3 className="font-semibold text-xl text-gray-800 my-0 mx-auto">
            Files
          </h3>
        </div>
        <Input
          type="file"
          hidden
          onChange={handleChange}
          disabled={uploadProgress > 0 && uploadProgress < 100}
          id="raised-button-file"
          className="flex items-center border border-[#603A35] px-4 py-2 rounded-md mt-4 w-[40%] cursor-pointer"
        />
        <label
          htmlFor="raised-button-file"
          className="flex items-center border border-[#603A35] px-4 py-2 rounded-md mt-4 w-[40%] cursor-pointer"
        >
          <MdInsertDriveFile className="mr-2 fill-[#603A35] h-6 w-6" />
          Select a file
        </label>

        <h3 className="font-600 mt-4">Selected</h3>
        {attachments.map((att, index) => (
          <div key={index}>
            <img src={att} />
          </div>
        ))}
      </div>
    </div>
  );
  
// This function will be passed as a prop to FirstTimeChatGuide
  const handleUseTemplate = (templateText) => {
    setMessageContent(templateText);
    
    // Focus the input and set cursor at the end
    if (messageInputRef.current) {
      messageInputRef.current.focus();
      
      setTimeout(() => {
        messageInputRef.current.setSelectionRange(
          templateText.length, 
          templateText.length
        );
      }, 0);
      
    }
  };

  return (
    <PageContainer maxWidth="lg">
      <Dialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
        }}
        title={dialogTitle}
        content={dialogMessage}
      ></Dialog>
      <BackButton />
      {showReportPopup && (
        <ReportPopup
          setShowPopup={setShowReportPopup}
          setShowConfirmReportPopup={setShowConfirmReportPopup}
          receiver_email={auth.currentUser.email}
          sender={sender}
          content={content}
        />
      )}
      {showConfirmReportPopup && (
        <ConfirmReportPopup setShowPopup={setShowConfirmReportPopup} />
      )}

      {isLoading ? 
      <LettersSkeleton /> : 
      <div className="min-h-screen bg-[#E5E7EB] p-4">
        <div className="bg-white shadow rounded-lg">
        { <FirstTimeChatGuide page="letterDetail" onUseTemplate={handleUseTemplate} params={pathname} recipient={recipients} /> }
          <LetterHeader
            attachmentsCount={attachments.length}
            onAttach={() => setIsFileModalOpen(true)}
            onSend={handleSendLetter}
            onDelete={() => {
              /* implement delete handler */
            }}
          />

          <RecipientList recipients={recipients} />

        {isFileModalOpen && <FileModal />}

          <div className="flex flex-col bg-grey gap-[8px] bg-[#F5F5F5]">
            {allMessages?.length ? (
              allMessages.map((message, index) => (
                <MessageBubble
                  key={index}
                  message={message}
                  isOwnMessage={message.sent_by.id === userRef?.id}
                  onReport={() => {
                    setSender(message.sent_by.id);
                    setContent(message.content);
                    setShowReportPopup(true);
                  }}
                />
              ))
            ) : (
              <span>No messages</span>
            )}

            {hasMoreMessages && !loadingMore && (
              <Button
                btnText="Load More"
                color="bg-blue-500"
                textColor="text-white"
                rounded="rounded"
                size="py-2 px-4 mt-4 mb-8"
                onClick={handleLoadMore}
              />
            )}

          {loadingMore && <span>Loading...</span>}
          </div>
          <TextArea
            id="message-input"
            value={letterContent}
            onChange={(e) => setLetterContent(e.target.value)}
            placeholder="Tap to write letter..."
            rows={10}
          />

          <div className="text-right text-sm mt-2 text-gray-600">
            {letterContent.length} / 1000
          </div>
        </div>
        <BottomNavBar />
        {isFileModalOpen && <FileModal />}

      </div>
      }
    </PageContainer>
  );
}
