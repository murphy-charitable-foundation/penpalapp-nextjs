"use client";

// pages/write-letter.js
import Image from "next/image";
import { useState } from "react";
import Link from "next/link";
import { db } from "../firebaseConfig"; // Adjust this path as necessary
import { collection, addDoc, getDocs } from "firebase/firestore";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { auth } from '../firebaseConfig';

import { RiDeleteBin6Line } from "react-icons/ri";
import { MdSend } from "react-icons/md";
import { BsPaperclip } from "react-icons/bs";
import { IoMdClose } from "react-icons/io";
import { MdInsertDriveFile } from "react-icons/md";

import BottomNavBar from '@/components/bottom-nav-bar';


export default function WriteLetter() {
  const [letterContent, setLetterContent] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const router = useRouter();
  const [isSending, setIsSending] = useState(false);
  const [user, setUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const auth = getAuth();
  const [currentUser, setCurrentUser] = useState(null);
  const [isFileModalOpen, setIsFileModalOpen] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      const usersCollectionRef = collection(db, "users");
      const snapshot = await getDocs(usersCollectionRef);
      const usersList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(usersList);
    };

    fetchUsers();
  }, []);

  const handleSendLetter = async () => {
    if (!letterContent.trim() || !selectedUser) {
      alert("Please fill in the letter content and select a recipient.");
      return;
    }

    if (!auth.currentUser) { // Directly using auth.currentUser for immediate check
      alert("Sender not identified, please log in.");
      return;
    }

    setIsSending(true);

    const letterData = {
      content: letterContent,
      recipientId: selectedUser.id,
      senderId: auth.currentUser.uid, // Directly using the uid from auth.currentUser
      timestamp: new Date(),
    };

    try {
      await addDoc(collection(db, "letters"), letterData);
      alert("Letter sent successfully!");
      setLetterContent("");
      setSelectedUser(null);
      setIsSending(false);
      // Optionally redirect the user or update UI to reflect the letter has been sent
    } catch (error) {
      console.error("Error sending letter: ", error);
      alert("Failed to send the letter.");
      setIsSending(false);
    }
  };



  // Simplified modal close and user selection functions
  const openRecipientModal = () => {
    console.log("Opening modal");
    setIsModalOpen(true);
  };

  const closeRecipientModal = () => setIsModalOpen(false);

  const RecipientModal = () => {
    return (
      <div className="fixed inset-0 flex justify-center items-center z-50 bg-black bg-opacity-40">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
          <h3 className="font-semibold text-xl mb-4 text-gray-800">
            Select a Recipient
          </h3>
          <ul className="max-h-60 overflow-auto mb-4">
            {users.map((user) => (
              <li
                key={user.id}
                onClick={() => selectUser(user)}
                className="p-3 hover:bg-blue-100 cursor-pointer text-gray-700 rounded-md"
              >
                {user.firstName} {user.lastName} - {user.country}
              </li>
            ))}
          </ul>
          <button
            onClick={() => setIsModalOpen(false)}
            className="mt-2 p-3 w-full bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-150"
          >
            Close
          </button>
        </div>
      </div>
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
            <IoMdClose class="h-full w-full" />
          </button>
          <h3 className="font-semibold text-xl text-gray-800 my-0 mx-auto">
            Files
          </h3>
        </div>
        <button className="flex items-center border border-[#603A35] px-4 py-2 rounded-md mt-4">
          <MdInsertDriveFile className="mr-2 fill-[#603A35] h-6 w-6" />
          Select a file
        </button>
        <h3 className="font-600 mt-4">Selected</h3>
        {/* <ul className="max-h-60 overflow-auto mb-4">
          {users.map((user) => (
            <li
              key={user.id}
              onClick={() => selectUser(user)}
              className="p-3 hover:bg-blue-100 cursor-pointer text-gray-700 rounded-md"
            >
              {user.firstName} {user.lastName} - {user.country}
            </li>
          ))}
        </ul> */}
      </div>
    </div>
  )


  const selectUser = (user) => {
    setSelectedUser({ ...user, profile_picture: "https://media.wired.com/photos/598e35fb99d76447c4eb1f28/master/pass/phonepicutres-TA.jpg" });
    closeRecipientModal(); // Close the modal upon selection
  };

  const openFileModal = () => setIsFileModalOpen(!isFileModalOpen)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser); // This will now work
      } else {
        setUser(null); // Clear user state when no user is logged in
      }
    });

    // Cleanup subscription on component unmount
    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-[#E5E7EB] p-4">
      <div className="bg-white shadow rounded-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-300 bg-[#FAFAFA]">
          <Link href="/">
            <button onClick={() => window.history.back()}>
              <img src="/closeicon.svg" />
            </button>
          </Link>
          <button className="opacity-0">{"<"}</button>
          {/* Attachments and Actions */}
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
                {/* <img src="/deleteicon.svg" /> */}
                <RiDeleteBin6Line className="h-6 w-6" />
              </button>
            </div>
          </div>

        </div>

        {/* Recipient Info */}
        <div className="flex items-center space-x-3 p-4 bg-[#F3F4F6] rounded-t-lg">
          {selectedUser ? (
            <>
              {/* Use a default placeholder if no photoURL is available */}
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                {selectedUser.profile_picture ? (
                  <img src={selectedUser.profile_picture} class="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl text-gray-600">
                    {selectedUser.firstName[0]}
                  </span>
                )}
              </div>
              <div>
                <h2 className="font-bold text-black">
                  {selectedUser.firstName} {selectedUser.lastName}
                </h2>
                <p className="text-sm text-gray-500">{selectedUser.country}</p>
              </div>
            </>
          ) : (
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-500 text-white p-2 rounded-lg"
            >
              Select a Recipient
            </button>
          )}
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
              <h3 className="font-semibold text-xl text-gray-800 mb-4">
                Select a Recipient
              </h3>
              <ul className="max-h-60 overflow-auto mb-4 text-gray-700">
                {users.map((user) => (
                  <li
                    key={user.id}
                    onClick={() => selectUser(user)}
                    className="p-3 hover:bg-blue-100 cursor-pointer rounded-md"
                  >
                    {user.firstName} - {user.country}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => setIsModalOpen(false)}
                className="mt-2 p-3 w-full bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-150"
              >
                Close
              </button>
            </div>
          </div>
        ) && <RecipientModal />}


        {isFileModalOpen && <FileModal />}


        {/* Text Area */}
        <textarea
          className="w-full p-4 text-black bg-[#ffffff] rounded-lg border-teal-500"
          rows="8"
          placeholder="Tap to write letter..."
          value={letterContent}
          onChange={(e) => setLetterContent(e.target.value)}
        />

        {/* Character Count */}
        <div className="text-right text-sm p-4 text-gray-600">
          {letterContent.length} / 1000
        </div>
      </div>
      <BottomNavBar />
    </div>
  );
}
