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
import { fetchData, fetchLetters, fetchRecipients } from "../../utils/firestore";
import { getDownloadURL, ref, uploadBytesResumable } from "@firebase/storage";


export default function Page({params}) {
  const {id} = params

  const [letterContent, setLetterContent] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const auth = getAuth();
  const [currentUser, setCurrentUser] = useState(null);
  const [isFileModalOpen, setIsFileModalOpen] = useState(null);
  const [draft, setDraft] = useState(null)
  const [userRef, setUserRef] = useState(null)
  const [selectedUserRef, setSelectedUserRef] = useState(null)
  const [allMessages, setAllMessages] = useState(null)
  const [availableChatIds, setAvailableChatIds] = useState(null)
  const [recipients, setRecipients] = useState(null)
  const [debounce, setDebounce] = useState(0)
  const [lettersRef, setLettersRef] = useState(null)
  const [attachments, setAttachments] = useState([])

  const handleSendLetter = async () => {
    if (!letterContent.trim() || !selectedUser) {
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
      draft: false
    };

    try {
      await updateDoc(doc(lettersRef, draft.id), letterData)
      alert("Letter sent successfully!");
      setLetterContent("");
      setSelectedUser(null);

    } catch (error) {
      console.error("Error sending letter: ", error);
      alert("Failed to send the letter.");
    }
  };

  useEffect(() => {
    if (user) {
      const userDocRef = doc(db, "users", user.uid);
      setUserRef(userDocRef)

      const fetchMessages = async () => {
        const messages = await fetchLetters(id, userRef)
        setAllMessages(messages)
      }
      fetchMessages()
    }
  }, [user])

  // set the recipient user
  useEffect(() => {
    const getSelectedUser = async () => {
      if (selectedUser) {
        const selectedUserDocRef = doc(db, "users", selectedUser.recipientId)
        setSelectedUserRef(selectedUserDocRef)
        const selUser = await getDoc(selectedUserDocRef)
        setRecipient(selUser.data())

        const letterboxRef = doc(collection(db, "letterbox"), selectedUser.letterboxId);
        const lRef = collection(letterboxRef, "letters");
        setLettersRef(lRef)
        const letterboxQuery = query(
          lRef,
          where("sent_by", "==", userRef),
        );
        const draftSnapshot = await getDocs(letterboxQuery);
        const draftDoc = draftSnapshot.docs.find(doc => doc.data().draft === true);
        if (draftDoc) {
          setDraft({ ...draftDoc.data(), id: draftDoc.id })
          setLetterContent(draftDoc.data().content)
        } else {
          const d = await addDoc(lRef, { sent_by: userRef, content: "", draft: true });

          setDraft({ sent_by: userRef, content: "", draft: true, id: d.id })
          setLetterContent("")
        }
      }
    }
    getSelectedUser()
  }, [selectedUser])

  useEffect(() => {
    let ids = []
    allMessages?.forEach(m => ids.push({ letterboxId: m.letterboxId, recipientId: m.receiver }))
    setAvailableChatIds(ids)
  }, [allMessages])

  useEffect(() => {
    setDebounce(debounce + 1)
    const updateDraft = async () => {
      if (userRef && selectedUserRef && lettersRef) {
        const letterData = {
          content: letterContent,
          sent_by: userRef,
          timestamp: new Date(),
          draft: true,
          attachments
        };
        try {
          await updateDoc(doc(lettersRef, draft.id), letterData);
        } catch (e) {
          console.error("failed", e)
        }

      }
    }
    if (debounce == 20) {
      updateDraft()
      setDebounce(0)
    }
  }, [letterContent])

  const closeRecipientModal = () => setIsModalOpen(false);

  // const RecipientModal = () => {
  //   return (
  //     (
  //       <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
  //         <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
  //           <h3 className="font-semibold text-xl text-gray-800 mb-4">
  //             Select a Recipient
  //           </h3>
  //           <ul className="max-h-60 overflow-auto mb-4 text-gray-700">
  //             {availableChatIds.map((chat) => (
  //               <li
  //                 key={chat.letterboxId}
  //                 onClick={() => selectUser(chat)}
  //                 className="p-3 hover:bg-blue-100 cursor-pointer rounded-md"
  //               >
  //                 {chat.recipientId}
  //               </li>
  //             ))}
  //           </ul>
  //           <button
  //             onClick={() => setIsModalOpen(false)}
  //             className="mt-2 p-3 w-full bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-150"
  //           >
  //             Close
  //           </button>
  //         </div>
  //       </div>
  //     )
  //   );
  // };

  const [uploadProgress, setUploadProgress] = useState(null)

  const handleChange = (event) => {
    const selectedFile = event.target.files[0];
    handleUpload(selectedFile)
  };

  const onUploadComplete = (url) => setAttachments([...attachments, url])

  const handleUpload = async (file) => {
    if (file) {
      console.log('uploading')
      const storageRef = ref(storage, `uploads/letterbox/${selectedUser?.letterboxId}/${file.name}`);
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
        {attachments.map(att => (
          <div>
            <img src={att} />
          </div>
        ))}
      </div>
    </div>
  )


  const selectUser = (user) => {
    setSelectedUser({ ...user });
    closeRecipientModal();
  };

  const openFileModal = () => setIsFileModalOpen(!isFileModalOpen)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        setUser(null);
      }
    });

    const populateRecipients = async () => {
      const members = await fetchRecipients(id)
      console.log(members)
      setRecipients(members)
    }

    populateRecipients()


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
            <span className="text-black">0 files</span>
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
            <>
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                {recipient?.profile_picture ? (
                  <img src={recipient?.profile_picture} class="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl text-gray-600">
                    {recipient?.first_name?.[0]}
                  </span>
                )}
              </div>
              <div>
                <h2 className="font-bold text-black">
                  {recipient?.first_name} {recipient?.last_name}
                </h2>
                <p className="text-sm text-gray-500">{recipient?.country}</p>
              </div>
            </>
          ))}
        </div>
          {/* ) : (
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-500 text-white p-2 rounded-lg"
            >
              Select a Recipient
            </button>
          )} */}

        {/* {isModalOpen && <RecipientModal />} */}

        {isFileModalOpen && <FileModal />}

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