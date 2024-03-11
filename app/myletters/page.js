"use client"

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { db } from '../firebaseConfig'; // Adjust this import to where your Firebase config is initialized
import { collection, query, where, getDocs } from 'firebase/firestore';

// Assuming you have a way to identify the current user
const currentUserUid = "CURRENT_USER_UID"; // Replace with actual current user's UID

const InboxPage = () => {
    const [letters, setLetters] = useState([]);

    useEffect(() => {
        const fetchLetters = async () => {
            // Query letters where the recipientId matches the current user's UID
            const lettersRef = collection(db, "letters");
            const q = query(lettersRef, where("recipientId", "==", currentUserUid));
            const querySnapshot = await getDocs(q);

            const fetchedLetters = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                received: doc.data().timestamp.toDate().toLocaleString(), // Format timestamp
            }));

            setLetters(fetchedLetters);
        };

        fetchLetters();
    }, []);

    return (
        <div className="bg-gray-100 min-h-screen">
            <div className="max-w-lg mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
                {/* Other UI elements */}
                {/* Letters List */}
                <main className="p-4">
                    {letters.map((letter) => (
                        <div key={letter.id} className={`flex items-center p-3 mb-2 rounded-lg hover:bg-gray-100 transition-colors duration-300`}>
                            <div className="w-12 h-12 relative mr-4">
                                {/* Replace with letter sender's image if available */}
                                <Image src="/usericon.png" alt="Sender" layout="fill" className="rounded-full" />
                            </div>
                            <div className="flex-grow">
                                <h3 className="font-semibold text-gray-800">From: {letter.senderId}</h3> {/* Update to display sender's name if available */}
                                <p className="text-gray-500">{letter.content}</p>
                                <span className="text-xs text-gray-400">{letter.received}</span>
                            </div>
                        </div>
                    ))}
                </main>
            </div>
        </div>
    );
};

export default InboxPage;
