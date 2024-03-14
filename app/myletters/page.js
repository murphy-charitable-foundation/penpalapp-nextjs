// "use client"

// import React, { useEffect, useState } from 'react';
// import Image from 'next/image';
// import Link from 'next/link';
// import { db } from '../firebaseConfig'; // Adjust this import to where your Firebase config is initialized
// import { collection, query, where, getDocs } from 'firebase/firestore';

// // Assuming you have a way to identify the current user
// const currentUserUid = "CURRENT_USER_UID"; // Replace with actual current user's UID

// const InboxPage = () => {
//     const [letters, setLetters] = useState([]);

//     useEffect(() => {
//         const fetchLetters = async () => {
//             // Query letters where the recipientId matches the current user's UID
//             const lettersRef = collection(db, "letters");
//             const q = query(lettersRef, where("recipientId", "==", currentUserUid));
//             const querySnapshot = await getDocs(q);

//             const fetchedLetters = querySnapshot.docs.map(doc => ({
//                 id: doc.id,
//                 ...doc.data(),
//                 received: doc.data().timestamp.toDate().toLocaleString(), // Format timestamp
//             }));

//             setLetters(fetchedLetters);
//         };

//         fetchLetters();
//     }, []);

//     return (
//         <div className="bg-gray-100 min-h-screen">
//             <div className="max-w-lg mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
//                 {/* Other UI elements */}
//                 {/* Letters List */}
//                 <main className="p-4">
//                     {letters.map((letter) => (
//                         <div key={letter.id} className={`flex items-center p-3 mb-2 rounded-lg hover:bg-gray-100 transition-colors duration-300`}>
//                             <div className="w-12 h-12 relative mr-4">
//                                 {/* Replace with letter sender's image if available */}
//                                 <Image src="/usericon.png" alt="Sender" layout="fill" className="rounded-full" />
//                             </div>
//                             <div className="flex-grow">
//                                 <h3 className="font-semibold text-gray-800">From: {letter.senderId}</h3> {/* Update to display sender's name if available */}
//                                 <p className="text-gray-500">{letter.content}</p>
//                                 <span className="text-xs text-gray-400">{letter.received}</span>
//                             </div>
//                         </div>
//                     ))}
//                 </main>
//             </div>
//         </div>
//     );
// };

// export default InboxPage;

"use client"

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { db, auth } from '../firebaseConfig';
import { collection, query, where, getDocs, doc } from 'firebase/firestore';
import { onAuthStateChanged } from "firebase/auth";
import { addDoc } from 'firebase/firestore';
import { getDoc } from 'firebase/firestore';


const InboxPage = () => {
    const [letters, setLetters] = useState([]);
    const [activeLetter, setActiveLetter] = useState(null); // State to keep track of the active letter
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isReplying, setIsReplying] = useState(false);
    const [replyMessage, setReplyMessage] = useState('');



    useEffect(() => {
        setIsLoading(true);
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                const fetchLetters = async () => {
                    try {
                        const lettersRef = collection(db, "letters");
                        const q = query(lettersRef, where("recipientId", "==", user.uid));
                        const querySnapshot = await getDocs(q);

                        const fetchedLetters = querySnapshot.docs.map(doc => ({
                            id: doc.id,
                            ...doc.data(),
                            received: doc.data().timestamp.toDate().toLocaleString(),
                        }));

                        setLetters(fetchedLetters);
                    } catch (err) {
                        setError('Failed to fetch letters. Please try again later.');
                        console.error(err);
                    } finally {
                        setIsLoading(false);
                    }
                };

                fetchLetters();
            } else {
                setError('No user logged in.');
                setIsLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);
    


    const handleLetterClick = (letter) => {
        setActiveLetter(letter); // Set the active letter to the one clicked
    };

    const handleCloseModal = () => {
        setActiveLetter(null); // Reset the active letter to close the modal
    };

    if (isLoading) {
        return <p>Loading letters...</p>;
    }

    if (error) {
        return <p>{error}</p>;
    }

    function Modal({ isOpen, onClose, children }) {
        if (!isOpen) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center text-black">
                <div className="bg-white p-4 rounded-lg shadow-lg max-w-sm w-full">
                    {children}
                    <div className="text-right mt-4">
                        <button onClick={onClose} className="py-2 px-4 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">Close</button>
                    </div>
                </div>
            </div>
        );
    }

    const handleSendReply = async () => {
        if (!replyMessage.trim()) {
            alert("Please type a reply.");
            return;
        }

        try {
            // Add reply to Firestore
            const docRef = await addDoc(collection(db, "replies"), {
                content: replyMessage,
                senderId: auth.currentUser.uid, // ID of the user sending the reply
                recipientId: activeLetter.senderId, // ID of the user who originally sent the letter
                originalLetterId: activeLetter.id, // ID of the original letter (optional, if you want to link the reply to the original letter)
                timestamp: new Date(), // Current timestamp
            });

            console.log("Reply sent successfully!", docRef.id);
            setIsReplying(false);
            setReplyMessage('');
            setActiveLetter(null); // Optionally close the modal after sending the reply
            alert("Reply sent successfully!");
        } catch (error) {
            console.error("Error sending reply:", error);
            alert("Failed to send the reply.");
        }
    };



    return (
        <div className="bg-gray-100 min-h-screen">
            <div className="max-w-lg mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
                <main className="p-4">
                    {letters.length > 0 ? (
                        letters.map((letter) => (
                            <div key={letter.id} className="flex items-center p-3 mb-2 rounded-lg hover:bg-gray-100 transition-colors duration-300" onClick={() => handleLetterClick(letter)}>
                                <div className="w-12 h-12 relative mr-4">
                                    <Image src="/usericon.png" alt="Sender" layout="fill" className="rounded-full" />
                                </div>
                                <div className="flex-grow">
                                    <h3 className="font-semibold text-gray-800">From: {letter.senderName || 'Unknown'}</h3>
                                    <p className="text-gray-500">{letter.content}</p>
                                    <span className="text-xs text-gray-400">{letter.received}</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p>No letters found.</p>
                    )}

                    {activeLetter && (
                        <Modal isOpen={!!activeLetter} onClose={() => { setActiveLetter(null); setIsReplying(false); }}>
                            <h2>Letter from {activeLetter.senderId}</h2>
                            <p>{activeLetter.content}</p>
                            <p>Received: {activeLetter.received}</p>
                            {!isReplying ? (
                                <button onClick={() => setIsReplying(true)} className="py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600">Reply</button>
                            ) : (
                                <>
                                    <textarea
                                        className="w-full p-2 mt-4 border rounded text-black"
                                        value={replyMessage}
                                        onChange={(e) => setReplyMessage(e.target.value)}
                                        placeholder="Type your reply..."
                                    />
                                    <button
                                        onClick={() => handleSendReply()}
                                        className="mt-2 py-2 px-4 bg-green-500 text-white rounded hover:bg-green-600"
                                    >
                                        Send
                                    </button>
                                </>
                            )}
                        </Modal>
                    )}

                </main>
            </div>
        </div>
    );
};

export default InboxPage;

