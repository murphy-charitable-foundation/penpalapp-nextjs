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

import { FiFileText, FiMic, FiSend } from "react-icons/fi";

export default function WriteLetter() {
  const [letterContent, setLetterContent] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const router = useRouter();
  const [isSending, setIsSending] = useState(false);
  const [user, setUser] = useState(null); 

  useEffect(() => {
    const fetchUsers = async () => {
      const usersCollectionRef = collection(db, "users");
      const snapshot = await getDocs(usersCollectionRef);
      const usersList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      console.log(usersList); // Check if users are fetched
      setUsers(usersList);
    };

    fetchUsers();
  }, []);

  // Function to send a letter
  const handleSendLetter = async () => {
    if (!letterContent.trim() || !selectedUser) {
      alert("Please fill in the letter content and select a recipient.");
      return;
    }

    // Assuming you're correctly retrieving the current user's ID. Adjust as needed.
    const senderId = "CURRENT_USER_ID"; // You should replace this with the actual current user's ID
    if (!senderId) {
      alert("Sender not identified, please log in.");
      return;
    }

    setIsSending(true);

    const letterData = {
      content: letterContent,
      recipientId: selectedUser.id, // Use the selected user's ID
      senderId: senderId,
      timestamp: new Date(), // Capture the current time as the send timestamp
      // Any other data you want to include in the letter document
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

  const [selectedUser, setSelectedUser] = useState(null);

  // Simplified modal close and user selection functions
  const openRecipientModal = () => {
    console.log("Opening modal");
    setIsModalOpen(true);
  };

  const closeRecipientModal = () => setIsModalOpen(false);

  const RecipientModal = () => {
    return (
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex justify-center items-center z-50">
        <div className="bg-white p-4 rounded-lg max-w-md w-full">
          <h3 className="font-semibold text-lg mb-2 text-black">
            Select a Recipient
          </h3>
          <ul className="max-h-60 overflow-auto">
            {users.map((user) => (
              <li
                key={user.id}
                onClick={() => selectUser(user)}
                className="p-2 hover:bg-gray-200 cursor-pointer text-black"
              >
                {user.firstName} {user.lastName} - {user.country}
              </li>
            ))}
          </ul>
          <button
            onClick={() => setIsModalOpen(false)}
            className="mt-4 p-2 w-full bg-gray-300 text-gray-700 rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    );
  };

  const selectUser = (user) => {
    setSelectedUser(user);
    closeRecipientModal(); // Close the modal upon selection
  };

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
            <button>
              <svg
                className="h-6 w-6 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          </Link>
          <h1 className="text-xl font-bold text-center flex-grow text-black">
            Write a letter
          </h1>
          <button className="opacity-0">{"<"}</button>
        </div>

        {/* Recipient Info */}
        <div className="flex items-center space-x-3 p-4 bg-[#F3F4F6] rounded-t-lg">
          {selectedUser ? (
            <>
              {/* Use a default placeholder if no photoURL is available */}
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-xl text-gray-600">
                  {selectedUser.firstName[0]}
                </span>
              </div>
              <div>
                <h2 className="font-bold text-black">
                  Re: {selectedUser.firstName}
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
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex justify-center items-center z-50 ">
              <div className="bg-white p-4 rounded-lg max-w-md w-full">
                <h3 className="font-semibold text-lg text-black mb-2">
                  Select a Recipient
                </h3>
                <ul className="max-h-60 overflow-auto text-black">
                  {users.map((user) => (
                    <li
                      key={user.id}
                      onClick={() => selectUser(user)}
                      className="p-2 hover:bg-gray-200 cursor-pointer"
                    >
                      {user.firstName} - {user.country}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="mt-4 p-2 w-full bg-gray-300 text-gray-700 rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>
          ) && <RecipientModal />}

        {/* Text Area */}
        <textarea
          className="w-full p-4 text-black bg-[#ffffff] rounded-lg border-teal-500"
          rows="8"
          placeholder="Tap to write letter..."
          value={letterContent}
          onChange={(e) => setLetterContent(e.target.value)}
        />

        {/* Attachments and Actions */}
        <div className="flex justify-between items-center p-4 bg-[#F3F4F6] border-t border-gray-300">
          <span className="text-black">0 files</span>
          <div className="space-x-2">
            <button className="text-black p-2 rounded-full">
              <FiFileText className="h-6 w-6" />
            </button>
            <button className="text-black p-2 rounded-full">
              <FiMic className="h-6 w-6" />
            </button>
            <button
              className="text-black p-2 rounded-full"
              onClick={handleSendLetter}
            >
              <FiSend className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Character Count */}
        <div className="text-right text-sm p-4 text-gray-600">
          {letterContent.length} / 1000
        </div>
      </div>
    </div>
  );
}
