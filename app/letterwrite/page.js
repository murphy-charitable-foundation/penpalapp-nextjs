
"use client"


// pages/write-letter.js
import Image from 'next/image';
import { useState } from 'react';
import Link from 'next/link';
import { db } from '../firebaseConfig'; // Adjust this import to where your Firebase config is initialized
import { collection, addDoc, getDocs} from 'firebase/firestore';
import { useRouter } from 'next/navigation'; // If you want to redirect after sending
import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';


import { FiFileText, FiMic, FiSend } from 'react-icons/fi';

export default function WriteLetter() {
    const [letterContent, setLetterContent] = useState("");
    const [isSending, setIsSending] = useState(false);
    const router = useRouter(); // useRouter hook for redirection
    const [users, setUsers] = useState([]);
    const [selectedRecipient, setSelectedRecipient] = useState(null);
    const { currentUser } = useContext(AuthContext); // Get current user info



    useEffect(() => {
        const fetchUsers = async () => {
            const querySnapshot = await getDocs(collection(db, "users"));
            const userList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setUsers(userList);
        };

        fetchUsers();
    }, []);

    // Function to send letter
    const handleSendLetter = async () => {
        if (!letterContent || !selectedRecipient) {
            alert("Please fill in the letter content and select a recipient.");
            return;
        }

        setIsSending(true);

        const letterData = {
            content: letterContent,
            recipientId: selectedRecipient.id, // Assuming you have the recipient's ID when selected
            senderId: currentUser.uid, // Get the sender's user ID from the current user context
            dateSent: new Date(),
            status: 'sent',
        };

        try {
            await addDoc(collection(db, "letters"), letterData);
            alert('Letter sent successfully!');
            setLetterContent(''); // Clear the letter content
            setIsSending(false);
            router.push('/sent-letters'); // Assuming you have a route for sent letters
        } catch (error) {
            console.error("Error sending letter: ", error);
            alert("Failed to send the letter.");
            setIsSending(false);
        }
    };

    // Open recipient selection modal
    const openRecipientModal = () => {
        setIsSelectingRecipient(true);
    };

    // Close recipient selection modal
    const closeRecipientModal = () => {
        setIsSelectingRecipient(false);
    };

    // Handle recipient selection
    const handleRecipientSelect = (user) => {
        setSelectedRecipient(user);
        closeRecipientModal();
    };


    const RecipientModal = () => (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex justify-center items-center z-50">
            <div className="bg-white p-4 rounded-lg max-w-md w-full">
                <h3 className="font-semibold text-lg mb-2">Select a Recipient</h3>
                <ul className="max-h-60 overflow-auto">
                    {users.map((user) => (
                        <li key={user.id} onClick={() => handleRecipientSelect(user)} className="p-2 hover:bg-gray-200 cursor-pointer">
                            {user.firstName} {user.lastName}
                        </li>
                    ))}
                </ul>
                <button onClick={closeRecipientModal} className="mt-4 p-2 w-full bg-gray-300 text-gray-700 rounded-lg">Close</button>
            </div>
        </div>
    );



    return (
        <div className="min-h-screen bg-[#E5E7EB] p-4">
            <div className="bg-white shadow rounded-lg">
                <div className="p-4 border-b border-gray-300 bg-[#FAFAFA] flex justify-between items-center">
                    <Link href="/">
                        <button className="text-gray-600"><FiSend className="h-6 w-6" /></button>
                    </Link>
                    <h1 className="text-xl font-bold text-black">Write a Letter</h1>
                    <div className="opacity-0">
                        <FiSend className="h-6 w-6" />
                    </div>
                </div>
                {selectedRecipient && (
                    <div className="p-4 bg-[#F3F4F6] flex items-center space-x-4">
                        <Image src="/usericon.png" alt="Recipient" width={40} height={40} className="rounded-full" />
                        <div>
                            <h2 className="font-bold text-black">{selectedRecipient.firstName} {selectedRecipient.lastName}</h2>
                        </div>
                    </div>
                )}
                <div className="p-4">
                    <textarea className="w-full p-4 h-60 text-black bg-white border border-gray-300 rounded-lg" placeholder="Start writing..." value={letterContent} onChange={(e) => setLetterContent(e.target.value)}></textarea>
                </div>
                <div className="flex justify-between items-center p-4 bg-[#F3F4F6]">
                    <button onClick={openRecipientModal} className="bg-blue-500 text-white p-2 rounded-lg">Select Recipient</button>
                    <div className="flex space-x-3">
                        <FiFileText className="h-6 w-6 text-gray-600" />
                        <FiMic className="h-6 w-6 text-gray-600" />
                        <FiSend className="h-6 w-6 text-gray-600" onClick={isSending ? null : handleSendLetter} />
                    </div>
                </div>
            </div>
            {isSelectingRecipient && <RecipientModal />}
        </div>
    );
}
