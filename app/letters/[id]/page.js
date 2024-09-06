"use client";

import Image from "next/image";
import { useState } from "react";
import Link from "next/link";
import { db } from "../../firebaseConfig";
import { collection, doc } from "firebase/firestore";
import { useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { RiDeleteBin6Line } from "react-icons/ri";
import { MdSend } from "react-icons/md";
import { BsPaperclip } from "react-icons/bs";
import ImageViwer from "@/components/ImageViewer";
import BottomNavBar from "@/components/bottom-nav-bar";
import {
  fetchDraft,
  fetchLetterbox,
  fetchRecipients,
  sendLetter,
} from "@/app/utils/letterboxFunctions";
import LetterCard from "@/components/letter/LetterCard";
import FileModal from "@/components/letter/FileModal";

export default function Page({ params }) {
  const { id } = params;

  const [letterContent, setLetterContent] = useState("");
  const [user, setUser] = useState(null);
  const auth = getAuth();
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [draft, setDraft] = useState(null);
  const [userRef, setUserRef] = useState(null);
  const [allMessages, setAllMessages] = useState(null);
  const [recipients, setRecipients] = useState(null);
  const [debounce, setDebounce] = useState(0);
  const [lettersRef, setLettersRef] = useState(null);
  const [attachments, setAttachments] = useState([]);

  const handleSendLetter = async () => {
    if (!letterContent.trim() || !recipients?.length) {
      alert("Please fill in the letter content and select a recipient.");
      return;
    }

    if (!auth.currentUser) {
      // Directly using auth.currentUser for immediate check
      alert("Sender not identified, please log in.");
      return;
    }

    const letterData = {
      content: letterContent,
      sent_by: userRef, // Directly using the uid from auth.currentUser
      status: "pending_review",
      created_at: new Date(),
      deleted: null,
      draft: false,
    };

    const letterStatus = await sendLetter(letterData, lettersRef, draft.id);
    if (letterStatus) {
      setLetterContent("");
      // TODO: refresh the page
    } else {
      alert("Failed to send your letter, please try again.");
    }
  };

  useEffect(() => {
    if (user) {
      const userDocRef = doc(db, "users", user.uid);
      setUserRef(userDocRef);

      const fetchMessages = async () => {
        const messages = await fetchLetterbox(id);
        console.log(messages);
        setAllMessages(messages);
      };
      fetchMessages();
    }
  }, [user, id]);

  // set the recipient user
  useEffect(() => {
    console.log("reciepient length: ", recipients?.length);
    const getSelectedUser = async () => {
      if (recipients?.length) {
        const letterboxRef = doc(collection(db, "letterbox"), id);
        const lRef = collection(letterboxRef, "letters");
        setLettersRef(lRef);
        const d = await fetchDraft(id, userRef);
        if (d) {
          setDraft(d);
          setLetterContent(d.content);
        }
      }
    };
    getSelectedUser();
  }, [recipients, id, userRef]);

  useEffect(() => {
    setDebounce(debounce + 1);
    const updateDraft = async () => {
      if (userRef && lettersRef) {
        const letterData = {
          content: letterContent,
          sent_by: userRef,
          timestamp: new Date(),
          deleted: null,
          draft: true,
          attachments,
        };

        const draftStatus = await sendLetter(letterData, lettersRef, draft.id);
        if (!draftStatus) {
          console.log("Error updating draft");
        }
      }
    };
    if (debounce >= 20) {
      updateDraft();
      setDebounce(0);
    }
  }, [letterContent]);

  const messageIsUsers = (recipients, message) => {
    return !recipients?.some(
      (r) =>
        r.id ===
        message.sent_by?._key?.path?.segments[
          message.sent_by?._key?.path?.segments?.length - 1
        ]
    );
  };

  useEffect(() => {
    const populateRecipients = async () => {
      try {
        const members = await fetchRecipients(id);
        console.log(members);
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
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="h-screen bg-[#E5E7EB] p-4">
      {isFileModalOpen && (
        <FileModal
          setIsFileModalOpen={setIsFileModalOpen}
          attachments={attachments}
          setAttachments={setAttachments}
          id={id}
        />
      )}
      <div className="bg-white shadow rounded-lg">
        <div className="flex items-center justify-between p-4 border-b border-gray-300 bg-[#FAFAFA]">
          <Link href="/">
            <button onClick={() => window.history.back()}>
              <Image
                alt="close-icon"
                height={100}
                width={100}
                className="h-4 w-4"
                src="/closeicon.svg"
              />
            </button>
          </Link>
          <button className="opacity-0">{"<"}</button>
          <div className="flex justify-between items-center p-4">
            {attachments.length ? (
              <span className="text-black">{attachments.length} files</span>
            ) : null}
            <div className="space-x-2">
              <button
                className="text-black p-2 rounded-full"
                onClick={() => setIsFileModalOpen(true)}
              >
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

        <div className="h-[calc(100vh-350px)] overflow-y-auto flex flex-col bg-grey bg-[#F5F5F5]">
          {allMessages?.map((message, index) => (
            <LetterCard
              key={`${message.id}_${index}`}
              content={message.content}
              createdAt={message.created_at.seconds}
              attachments={message.attachments}
              id={message}
            />
          ))}
        </div>
      </div>
      <div>
        {attachments?.length > 0 && (
          <div className="flex gap-2 bg-white p-2">
            <ImageViwer styleClass="h-12 w-12" imageSources={attachments} />
          </div>
        )}
        <textarea
          className="w-full border p-4 text-black bg-[#ffffff] focus:outline-none resize-none shadow-md"
          rows="4"
          placeholder="Reply to the letter..."
          value={letterContent}
          onChange={(e) => setLetterContent(e.target.value)}
        />
      </div>
      <BottomNavBar />
    </div>
  );
}
