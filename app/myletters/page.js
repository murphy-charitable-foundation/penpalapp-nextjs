"use client"

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { db, auth } from '../firebaseConfig';
import { collection, query, where, getDocs, doc } from 'firebase/firestore';
import { onAuthStateChanged } from "firebase/auth";
import { addDoc } from 'firebase/firestore';
import { getDoc } from 'firebase/firestore';
import BottomNavBar from "../../components/bottom-nav-bar";
import * as Sentry from "@sentry/nextjs";


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
                        Sentry.captureException(error);
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
            <div className="fixed inset-0 bg-gray-900 bg-opacity-70 z-50 flex justify-center items-center">
                <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-2xl w-full m-4 space-y-6 bg-gradient-to-br from-white to-gray-50">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-medium text-gray-800">
                            Letter Details
                        </h2>
                        <button onClick={onClose} className="rounded-full text-gray-500 hover:text-gray-800 focus:outline-none transition duration-150 ease-in-out">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                    <div className="text-lg text-gray-700 space-y-4 divide-y divide-gray-200">
                        {children}
                    </div>
                    <div className="flex justify-end gap-4 mt-4">
                        <button onClick={onClose} className="py-2 px-6 text-sm font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50 transition ease-in-out duration-300">
                            Close
                        </button>
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
        <div className="bg-gradient-to-r from-blue-100 to-gray-100 min-h-screen">
            <h1 className="text-4xl text-black font-bold text-center py-8">Incoming Letters</h1>
            <button onClick={() => window.history.back()}>
                <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
            </button>
            <div className="max-w-lg mx-auto bg-white shadow-2xl rounded-lg overflow-hidden">
                <main className="p-12">
                    {letters.length > 0 ? (
                        letters.map((letter) => (
                            <div key={letter.id} className="flex items-center p-4 mb-3 rounded-lg hover:bg-gray-200 hover:scale-105 transition-all duration-300" onClick={() => handleLetterClick(letter)}>
                                <div className="w-12 h-12 relative mr-4">
                                    <Image src="/usericon.png" alt="Sender" layout="fill" className="rounded-full" />
                                </div>
                                <div className="flex-grow">
                                    <h3 className="font-semibold text-gray-800">From: {letter.senderName || 'Unknown'}</h3>
                                    <p className="text-gray-600">{letter.content}</p>
                                    <span className="text-xs text-gray-400">{letter.received}</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p>No letters found.</p>
                    )}

                    {activeLetter && (
                        <Modal isOpen={!!activeLetter} onClose={() => { setActiveLetter(null); setIsReplying(false); }}>
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-800">Letter from {activeLetter.senderId}</h3>
                                <p className="text-gray-600">{activeLetter.content}</p>
                                <p className="text-sm text-gray-500">Received: {activeLetter.received}</p>
                            </div>
                            {!isReplying ? (
                                <button onClick={() => setIsReplying(true)} className="mt-4 py-2 px-6 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition ease-in-out duration-300 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50">
                                    Reply
                                </button>
                            ) : (
                                <>
                                    <textarea
                                        className="mt-4 w-full p-3 border border-gray-300 rounded-lg text-gray-700 focus:ring-blue-500 focus:border-blue-500 transition ease-in-out duration-300"
                                        value={replyMessage}
                                        onChange={(e) => setReplyMessage(e.target.value)}
                                        placeholder="Type your reply..."
                                    />
                                    <button
                                        onClick={() => handleSendReply()}
                                        className="mt-4 py-2 px-6 bg-green-500 text-white rounded-full hover:bg-green-600 transition ease-in-out duration-300 focus:outline-none focus:ring-2 focus:ring-green-300 focus:ring-opacity-50"
                                    >
                                        Send
                                    </button>
                                </>
                            )}
                        </Modal>
                    )}

                </main>
            </div>
            <BottomNavBar />
        </div>
    );
};

export default InboxPage;

