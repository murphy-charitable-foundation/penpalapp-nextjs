"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import Link from "next/link";
import { db } from "../../firebaseConfig"; // Adjust this path as necessary
import { collection, doc } from "firebase/firestore";
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

  const [letterContent, setLetterContent] = useState("");
  const [debounce, setDebounce] = useState(0);
  const [user, setUser] = useState(null);
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [draft, setDraft] = useState(null);
  const [userRef, setUserRef] = useState(null);
  const [allMessages, setAllMessages] = useState([]);
  const [recipients, setRecipients] = useState(null);
  const [lettersRef, setLettersRef] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [lastVisible, setLastVisible] = useState(null); // To store the last visible letter for pagination
  const [loadingMore, setLoadingMore] = useState(false); // To track if loading more is in progress
  const [hasMoreMessages, setHasMoreMessages] = useState(true); // Track if there are more messages to load
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

    const letterStatus = await sendLetter(letterData, lettersRef, draft.id);
    if (letterStatus) {
      setLetterContent("");
      setAttachments([]);
    } else {
      Sentry.captureException(e);
      setIsDialogOpen(true);
      setDialogTitle("Oops!");
      setDialogMessage("Failed to send your letter, please try again.");
    }

    const { messages, lastVisible: newLastVisible } = await fetchLetterbox(
      id,
      PAGINATION_INCREMENT
    );
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
      };
      fetchMessages();
    }
  }, [user]);

  useEffect(() => {
    const getSelectedUser = async () => {
      if (recipients?.length) {
        const letterboxRef = doc(collection(db, "letterbox"), id);
        const lRef = collection(letterboxRef, "letters");
        setLettersRef(lRef);
        const d = await fetchDraft(id, userRef, true);
        setDraft(d);
        setLetterContent(d.content);
      }
    };
    getSelectedUser();
  }, [recipients]);

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

  const handleChange = (event) => {
    const selectedFile = event.target.files[0];
    handleUpload(selectedFile);
  };

  const onUploadComplete = (url) => setAttachments([...attachments, url]);

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

  useEffect(() => {
    const populateRecipients = async () => {
      try {
        const members = await fetchRecipients(id);
        setRecipients(members);
      } catch (e) {
        console.error("err fetching members", e);
      }
    };
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        populateRecipients();
      } else {
        setUser(null);
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, []);

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

      <div className="min-h-screen bg-[#E5E7EB] p-4">
        <div className="bg-white shadow rounded-lg">
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
    </PageContainer>
  );
}
