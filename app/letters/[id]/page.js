"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import Link from "next/link";
import { db, storage } from "../../firebaseConfig"; // Adjust this path as necessary
import { collection, doc } from "firebase/firestore";
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
  const [debounce, setDebounce] = useState(0);
  const [user, setUser] = useState(null);
  const auth = getAuth();
  const [isFileModalOpen, setIsFileModalOpen] = useState(null);
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

  const handleSendLetter = async () => {
    if (!letterContent.trim() || !recipients?.length) {
      alert("Please fill in the letter content and select a recipient.");
      return;
    }

    if (!auth.currentUser) {
      alert("Sender not identified, please log in.");
      return;
    }

    const letterData = {
      content: letterContent,
      sent_by: userRef,
      status: "sent",
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

    const { messages, lastVisible: newLastVisible } = await fetchLetterbox(id, 5);
    setAllMessages(messages);
    setLastVisible(newLastVisible);
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
        const { messages, lastVisible: newLastVisible } = await fetchLetterbox(id, 5);
        console.log("MESSAGES", messages)
        setAllMessages(messages);
        setLastVisible(newLastVisible); // Store last visible letter for pagination
        setHasMoreMessages(messages.length === 5); // Assuming 10 is the page limit
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
      setDebounce(0)
      updateDraft()
    }
  }, [letterContent])

    const handleLoadMore = async () => {
      setLoadingMore(true); // Set loading state to true while fetching more messages
      const { messages, lastVisible: newLastVisible } = await fetchLetterbox(id, 5, lastVisible);
      setAllMessages((prevMessages) => [...prevMessages, ...messages]);
      setLastVisible(newLastVisible); // Update lastVisible with the new last document
      setHasMoreMessages(messages.length === 10); // If fewer than 10 messages are returned, no more messages to load
      setLoadingMore(false); // Reset loading state
    };

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
                createdAt={message.created_at?.seconds}
                attachments={message.attachments}
                user={message.user}
                id={message}
              />
            ))}
          </div>
          {hasMoreMessages && !loadingMore && (
            <button onClick={handleLoadMore} className="py-2 px-4 mt-4 mb-8 bg-blue-500 text-white rounded">
              Load More
            </button>
          )}

          {loadingMore && <span>Loading...</span>}
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

        <div className="text-right text-sm p-4 mt-8 text-gray-600">
          {letterContent.length} / 1000
        </div>
      </div >
      <BottomNavBar />
    { isFileModalOpen && <FileModal /> }
    </div >
  );
}
