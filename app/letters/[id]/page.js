"use client";

// pages/write-letter.js
import Image from "next/image";
import { useState } from "react";
import Link from "next/link";
import { db, storage } from "../../firebaseConfig"; // Adjust this path as necessary
import { collection, addDoc, getDocs, getDoc, doc, query, where, updateDoc } from "firebase/firestore";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { auth } from '../../firebaseConfig';

import { RiDeleteBin6Line } from "react-icons/ri";
import { MdSend } from "react-icons/md";
import { BsPaperclip } from "react-icons/bs";
import { IoMdClose } from "react-icons/io";
import { MdInsertDriveFile } from "react-icons/md";

import BottomNavBar from '@/components/bottom-nav-bar';
import { getDownloadURL, ref, uploadBytesResumable } from "@firebase/storage";
import { fetchDraft, fetchLetterbox, fetchRecipients, sendLetter } from "@/app/utils/letterboxFunctions";


export default function Page({ params }) {
  const { id } = params

  const [letterContent, setLetterContent] = useState("");
  const [user, setUser] = useState(null);
  const auth = getAuth();
  const [isFileModalOpen, setIsFileModalOpen] = useState(null);
  const [draft, setDraft] = useState(null)
  const [userRef, setUserRef] = useState(null)
  const [allMessages, setAllMessages] = useState([])
  const [recipients, setRecipients] = useState(null)
  const [debounce, setDebounce] = useState(0)
  const [lettersRef, setLettersRef] = useState(null)
  const [attachments, setAttachments] = useState([])

  const handleSendLetter = async () => {
    if (!letterContent.trim() || !recipients?.length) {
      alert("Please fill in the letter content and select a recipient.");
      return;
    }

    if (!auth.currentUser) { // Directly using auth.currentUser for immediate check
      alert("Sender not identified, please log in.");
      return;
    }

    const letterData = {
      content: letterContent,
      sent_by: userRef, // Directly using the uid from auth.currentUser
      status: "pending_review",
      created_at: new Date(),
      deleted: null,
      draft: false
    };

    const letterStatus = await sendLetter(letterData, lettersRef,  draft.id)
    if(letterStatus) {
      setLetterContent("")
    } else {
      alert("Failed to send your letter, please try again.")
    }
    // refresh the data
    const messages = await fetchLetterbox(id)
    setAllMessages(messages)

  };

  useEffect(() => {
    if (user) {
      const userDocRef = doc(db, "users", user.uid);
      setUserRef(userDocRef)

      const fetchMessages = async () => {
        const messages = await fetchLetterbox(id)
        setAllMessages(messages)
      }
      fetchMessages()
    }
  }, [user])

  // set the recipient user
  useEffect(() => {
    const getSelectedUser = async () => {
      if (recipients?.length) {
        const letterboxRef = doc(collection(db, "letterbox"), id);
        const lRef = collection(letterboxRef, "letters");
        setLettersRef(lRef)
        const d = await fetchDraft(id, userRef)
        setDraft(d)
        setLetterContent(d.content)
      }
    }
    getSelectedUser()
  }, [recipients])

  useEffect(() => {
    setDebounce(debounce + 1)
    const updateDraft = async () => {
      if (userRef && lettersRef) {
        const letterData = {
          content: letterContent,
          sent_by: userRef,
          timestamp: new Date(),
          deleted: null,
          draft: true,
          attachments
        };
        const draftStatus = await sendLetter(letterData, lettersRef, draft.id)
        if(!draftStatus) {
          console.log("Error updating draft")
        }
      }
    }
    if (debounce >= 20) {
      updateDraft()
      setDebounce(0)
    }
  }, [letterContent])

  const [uploadProgress, setUploadProgress] = useState(null)

  const handleChange = (event) => {
    const selectedFile = event.target.files[0];
    handleUpload(selectedFile)
  };

  const onUploadComplete = (url) => setAttachments([...attachments, url])

  const handleUpload = async (file) => {
    if (file) {
      const storageRef = ref(storage, `uploads/letterbox/${id}/${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error('Upload error:', error);
        },
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          onUploadComplete(url)
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
        {attachments.map(att, index => (
          <div key={index}>
            <img src={att}/>
          </div>
        ))}
      </div>
    </div>
  )

  const openFileModal = () => setIsFileModalOpen(!isFileModalOpen)

  const messageIsUsers = (recipients, message) => {
    return !recipients?.some(r => r.id === message.sent_by?._key?.path?.segments[message.sent_by?._key?.path?.segments?.length - 1])
  }

  useEffect(() => {
    const populateRecipients = async () => {
      try {
        const members = await fetchRecipients(id)
        setRecipients(members)
      } catch (e) {
        console.error("err fetching members", e)
      }
    } 
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        populateRecipients()
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
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
              <button className="text-black p-2 rounded-full" onClick={openFileModal}>
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

        <div className="flex items-center space-x-3 p-4 bg-[#F3F4F6] rounded-t-lg">
          {recipients?.length && recipients.map(recipient => (
            <div key={recipient?.first_name?.[0]}>
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                {recipient?.profile_picture ? (
                  <img src={recipient?.profile_picture} class="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl text-gray-600">
                    {recipient?.first_name?.[0]}
                  </span>
                )}
              </div>
              <div key={`${recipient?.first_name?.[0]}_`}>
                <h2 className="font-bold text-black">{recipient?.first_name} {recipient?.last_name}</h2>
                <p className="text-sm text-gray-500">{recipient?.country}</p>
              </div>
            </div>
          ))}
        </div>

        {isFileModalOpen && <FileModal />}

        <div className="flex flex-col bg-grey gap-[8px] bg-[#F5F5F5]">
          {allMessages.length && allMessages?.map((message, index) => (
            <div className={`w-[90%] flex bg-white m-8 ${message.status === "pending_review" ? 'opacity-[0.6]' : ''} ${messageIsUsers(recipients, message) ? 'text-right justify-end' : 'text-left'}`} key={`${message.id}_${index}`}>
              {message.attachments?.length ? (
                <div className={`flex w-full`}>
                  {message.attachments?.map((att, i) => (
                    <div key={i} className="max-h-[80px]">
                      <img src={att} />
                    </div>
                  ))}
                </div>
              ) : (<></>)}
              <div key={message.id}>{message.content}</div>
            </div>
          ))
          }
        </div>

        <textarea
          className="w-full p-4 text-black bg-[#ffffff] rounded-lg border-teal-500"
          rows="8"
          placeholder="Tap to write letter..."
          value={letterContent}
          onChange={(e) => setLetterContent(e.target.value)}
        />

        <div className="text-right text-sm p-4 text-gray-600">
          {letterContent.length} / 1000
        </div>
      </div>
      <BottomNavBar />
    </div>
  );
}
