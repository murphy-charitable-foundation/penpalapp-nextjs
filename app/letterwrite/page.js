"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { db } from "../firebaseConfig";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { FiFile, FiSend, FiTrash } from "react-icons/fi";
import BottomNavBar from "../../components/bottom-nav-bar";
import { FaFile } from "react-icons/fa";
import dynamic from "next/dynamic";

export default function WriteLetter() {
  const [letterContent, setLetterContent] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const auth = getAuth();
  const storage = getStorage();
  const fileInputRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUsers = async () => {
      const usersCollectionRef = collection(db, "users");
      const snapshot = await getDocs(usersCollectionRef);
      const usersList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(usersList);
      console.log("Fetched users:", usersList);
    };

    fetchUsers();
  }, []);

  const handleFileIconClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    setAttachments((prev) => [...prev, ...newFiles]);
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFile = async (file) => {
    const userId = auth.currentUser.uid;
    const storageRef = ref(storage, `attachments/${userId}/${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const handleSendLetter = async () => {
    const contentString = editor.document
      .map(block => block.content?.map(c => c.text).join('') || '')
      .join('\n')
      .trim();

    if (!contentString || !selectedUser) {
      alert("Please fill in the letter content and select a recipient.");
      return;
    }

    if (!auth.currentUser) {
      alert("Sender not identified, please log in.");
      return;
    }

    setIsSending(true);

    try {
      const uploadedAttachments = await Promise.all(attachments.map(uploadFile));

      const letterData = {
        content: contentString,
        recipientId: selectedUser.id,
        senderId: auth.currentUser.uid,
        timestamp: new Date(),
        attachments: uploadedAttachments,
      };

      await addDoc(collection(db, "letters"), letterData);
      alert("Letter sent successfully!");
      editor.replaceBlocks(editor.document, [
        { type: "paragraph", content: "" }
      ]);
      setSelectedUser(null);
      setAttachments([]);
      setIsSending(false);
    } catch (error) {
      console.error("Error sending letter: ", error);
      alert("Failed to send the letter.");
      setIsSending(false);
    }
  };

  const selectUser = (user) => {
    setSelectedUser(user);
    setIsModalOpen(false);
    console.log("Selected user:", user);
  };

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="bg-white shadow rounded-lg">
        {/* Header */}
  
        {/* Recipient Info */}
        <div className="flex items-center space-x-3 p-4 bg-white rounded-t-lg border-b border-gray-300">
          {selectedUser ? (
            <>
              <img
                src={selectedUser.photoURL || "/usericon.png"}
                alt="Profile"
                className="w-10 h-10 rounded-full"
              />
              <div>
                <h2 className="font-bold text-black">
                  {selectedUser.firstName} Palermo
                </h2>
                <p className="text-sm text-gray-500">{selectedUser.country}</p>
              </div>
            </>
          ) : (
            <div className="relative">
              <button
                onClick={() => setIsModalOpen(!isModalOpen)}
                className="bg-blue-700 hover:bg-blue-600 text-white px-4 py-2 rounded"
              >
                Select a Recipient
              </button>
              {isModalOpen && (
                <div className="absolute left-0 mt-2 bg-white p-6 rounded-lg shadow-xl max-w-md w-full z-10">
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
              )}
            </div>
          )}
        </div>
  
        {/* Text Area */}
        <textarea
          className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={letterContent}
          onChange={(e) => setLetterContent(e.target.value)}
          rows="10"
        ></textarea>
  
        <div className="space-x-2 flex p-4">
          <button
            onClick={handleFileIconClick}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              ></path>
            </svg>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
            multiple
          />
          <button
            onClick={handleSendLetter}
            disabled={isSending}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 4l8 8-8 8-8-8 8-8z"
              ></path>
            </svg>
          </button>
          <button
            onClick={() => {
              setLetterContent("");
              setAttachments([]);
            }}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM8 9h8v10H8V9zm7.5-5l-1-1h-5l-1 1H5v2h14V4h-3.5z"
              ></path>
            </svg>
          </button>
        </div>
  
        {/* Display selected attachments */}
        {attachments.length > 0 && (
          <div className="p-4">
            <p>Selected files:</p>
            <ul>
              {attachments.map((file, index) => (
                <li key={index}>{file.name}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <BottomNavBar />
    </div>
  );
}