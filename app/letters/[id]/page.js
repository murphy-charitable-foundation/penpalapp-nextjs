"use client";

import Image from "next/image";
import { useState } from "react";
import Link from "next/link";
import { db, storage } from "../../firebaseConfig"; // Adjust this path as necessary
import { collection, doc } from "firebase/firestore";
import { useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";

import { RiDeleteBin6Line } from "react-icons/ri";
import { MdSend } from "react-icons/md";
import { BsPaperclip } from "react-icons/bs";

import BottomNavBar from "@/components/bottom-nav-bar";
import { getDownloadURL, ref, uploadBytesResumable } from "@firebase/storage";
import {
  fetchDraft,
  fetchLetterbox,
  fetchRecipients,
  sendLetter,
} from "@/app/utils/letterboxFunctions";
import LetterCard from "@/components/letter/LetterCard";
import FileModal from "@/components/letter/FileModal";
import ImageViewer from "@/components/ImageViewer";

export default function Page({ params }) {
  const { id } = params;

  const [letterContent, setLetterContent] = useState("");
  const [user, setUser] = useState(null);
  const auth = getAuth();
  const [isFileModalOpen, setIsFileModalOpen] = useState(null);
  const [draft, setDraft] = useState(null);
  const [userRef, setUserRef] = useState(null);
  const [allMessages, setAllMessages] = useState([]);
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
      };

      const letterStatus = await sendLetter(letterData, lettersRef, draft.id);
      if (letterStatus) {
        setLetterContent("");
        setAttachments([]);
      } else {
        alert("Failed to send your letter, please try again.");
      }
      // TODO: UI FIX we need a message to let the user know we are awaiting approval
      const messages = await fetchLetterbox(id);
      setAllMessages(messages);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        setUser(null);
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [auth]);

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

  useEffect(() => {
    setDebounce(debounce + 1);
    const updateDraft = async () => {
      if (userRef && lettersRef) {
        const letterData = {
          content: letterContent,
          sent_by: userRef,
          timestamp: new Date(),
          deleted: null,
          status: "draft",
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

  const [uploadProgress, setUploadProgress] = useState(null);

  const handleChange = (event) => {
    const selectedFile = event.target.files[0];
    handleUpload(selectedFile);
  };

  const onUploadComplete = (url) => setAttachments([...attachments, url]);

  const handleUpload = async (file) => {
    if (file) {
      const storageRef = ref(storage, `uploads/letterbox/${id}/${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error("Upload error:", error);
        },
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          onUploadComplete(url);
        }
      );
    }
  };

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
              user={message.user}
              id={message}
            />
          ))}
        </div>
      </div>
      <div>
        {attachments?.length > 0 && (
          <div className="flex gap-2 bg-white p-2">
            <ImageViewer styleClass="h-12 w-12" imageSources={attachments} />
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
