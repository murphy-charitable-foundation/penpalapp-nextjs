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
import BottomNavBar from "@/components/bottom-nav-bar";
import { uploadFile } from "@/app/lib/uploadFile";
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
import { logButtonEvent, logLoadingTime } from "@/app/utils/analytics";
import { usePageAnalytics } from "@/app/utils/useAnalytics";

import { useRouter } from "next/navigation";

import * as Sentry from "@sentry/nextjs";

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
  const PAGINATION_INCREMENT = 20;
  usePageAnalytics(`/letters/letterId`);

  const handleSendLetter = async () => {
    if (!letterContent.trim() || !recipients?.length) {
      alert("Please fill in the letter content and select a recipient.");
      return;
    }

    if (!auth.currentUser) {
      alert("Sender not identified, please log in.");
      return;
    }
    const letterUserRef =  userRef ?? doc(db, "users", auth.currentUser.uid); // TODO: make population of userRef blocking and cached to be available throughout the call
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
      alert("Failed to send your letter, please try again.");
    }

    const { messages, lastVisible: newLastVisible } = await fetchLetterbox(id, PAGINATION_INCREMENT);
    setAllMessages(messages);
    setLastVisible(newLastVisible);
    setDraft(null);
    const d = await fetchDraft(id, userRef, true);
    setDraft(d);
    setLetterContent(d.content);
  };

  useEffect(() => {
    const startTime = performance.now();
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
      requestAnimationFrame(() => {
        setTimeout(() => {
          const endTime = performance.now();
          const loadTime = endTime - startTime;
          console.log(`Page render time: ${loadTime}ms`);
          logLoadingTime("/letters/letterId", loadTime);
        }, 0);
      });
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
    setDebounce(debounce + 1)
    const updateDraft = async () => {
      if (userRef && lettersRef) {
        const letterData = {
          content: letterContent,
          sent_by: userRef,
          created_at: new Date(),
          deleted: null,
          status: "draft",
          attachments
        };
        await sendLetter(letterData, lettersRef, draft.id)
      }
    }
    if (debounce >= 20) {
      updateDraft()
      setDebounce(0)
    }
  }, [letterContent])

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
    logButtonEvent("Load more clicked!", "/letters/letterId");
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
          <button
            onClick={() => setIsFileModalOpen(false)}
            className="rounded-lg transition-colors duration-150 h-6 w-6 absolute top-0 left-0"
          >
            <IoMdClose className="h-full w-full" />
          </button>
          <h3 className="font-semibold text-xl text-gray-800 my-0 mx-auto">
            Files
          </h3>
        </div>
        <input type="file" hidden onChange={handleChange} disabled={uploadProgress > 0 && uploadProgress < 100} id="raised-button-file" />
        <label htmlFor="raised-button-file" className="flex items-center border border-[#603A35] px-4 py-2 rounded-md mt-4 w-[40%] cursor-pointer">
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
    <div>
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
          <div className="flex items-center justify-between p-4 border-b border-gray-300 bg-[#FAFAFA]">
            <Link href="/">
              <button onClick={() => window.history.back()}>
                <img src="/closeicon.svg" />
              </button>
            </Link>
            <button className="opacity-0">{"<"}</button>
            <div className="flex justify-between items-center p-4">
              <span className="text-black">{attachments.length} files</span>
              <div className="space-x-2">
                <button className="text-black p-2 rounded-full" onClick={() => setIsFileModalOpen(true)}>
                  <BsPaperclip className="h-6 w-6 rotate-90" />
                </button>
                <button
                  className="text-black p-2 rounded-full"
                  onClick={handleSendLetter}
                >
                  <MdSend className="h-6 w-6" />
                </button>
                <button className="text-black p-2 rounded-full">
                  <RiDeleteBin6Line className="h-6 w-6" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex  space-x-6 p-4 bg-[#F3F4F6] rounded-t-lg">
            {recipients?.length && recipients.map(recipient => (
              <div key={recipient?.first_name?.[0]}>
                <ProfileImage photo_uri={recipient?.photo_uri} first_name={recipient?.first_name} size={20}/>
                <div key={`${recipient?.first_name?.[0]}_`}>
                  <h2 className="font-bold text-black">{recipient?.first_name} {recipient?.last_name}</h2>
                  <p className="text-sm text-gray-500">{recipient?.country}</p>
                </div>
                
              </div>
            ))}
          </div>

          {isFileModalOpen && <FileModal />}

          <div className="flex flex-col bg-grey gap-[8px] bg-[#F5F5F5]">
            {allMessages?.length ? (
              allMessages.map((message, index) => (
                <div key={index} className={`w-[35%] flex bg-white p-4 rounded-lg text-gray-600 mb-4 ${message.sent_by.id === userRef.id && "self-end"}`}>
                  <div className="flex flex-col w-[90%]">
                    {message?.attachments?.length ? (
                      <Image
                        alt="attachment"
                        width={100}
                        height={100}
                        src={message.attachments[0]}
                      />
                    ) : null}
                    <span>{message.content}</span>
                    <section className="px-5">
                      <div className="flex justify-end mb-2">
                        <FaExclamationCircle
                          className="cursor-pointer"
                          onClick={() => {
                            setSender(message.sent_by.id);
                            setContent(message.content);
                            setShowReportPopup(true);  
                          }}
                        />
                      </div>
                      
                    </section>
                  </div>
                </div>
              ))
            ) : (
              <span>No messages</span>
            )}

            {hasMoreMessages && !loadingMore && (
              <button onClick={handleLoadMore} className="py-2 px-4 mt-4 mb-8 bg-blue-500 text-white rounded">
                Load More
              </button>
            )}

            {loadingMore && <span>Loading...</span>}
          </div>
          <textarea
            className="w-full p-4 text-black bg-[#ffffff] rounded-lg border-teal-500"
            rows="8"
            placeholder="Tap to write letter..."
            value={letterContent}
            onChange={(e) => setLetterContent(e.target.value)}
          />

          <div className="text-right text-sm p-4 mt-8 text-gray-600">
            {letterContent.length} / 1000
          </div>
        </div>
        <BottomNavBar />
        {isFileModalOpen && <FileModal />}
      </div>
    </div>
  );
}
