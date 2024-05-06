"use client"


// pages/index.js
import Image from 'next/image';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db, auth } from '../firebaseConfig'; // Adjust the import path as necessary
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from 'firebase/firestore';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { differenceInCalendarYears } from 'date-fns';
import BottomNavBar from '@/components/bottom-nav-bar';



import { FaUserCircle, FaRegEnvelope, FaCompass, FaInfoCircle, FaPhone, FaDonate, FaCog, FaBell, FaPen, FaUserAlt, FaHandHoldingHeart, FaInfo, FaEnvelopeOpenText } from 'react-icons/fa';



export default function Home() {

    const [userName, setUserName] = useState('');
    const [country, setCountry] = useState('');
    const [lastLetters, setLastLetters] = useState([]);
    const [letters, setLetters] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');



    useEffect(() => {
        const fetchUserData = async () => {
            if (auth.currentUser) {
                const uid = auth.currentUser.uid;
                const docRef = doc(db, "users", uid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const userData = docSnap.data();
                    // Assuming the user's name is stored under a 'name' field. Adjust as necessary.
                    setUserName(userData.first_name || 'Unknown User'); // You can adjust this line to concatenate firstName and lastName if you want
                    setCountry(userData.country || 'Unknown Country');
                } else {
                    console.log("No such document!");
                }
            } else {
                console.log("No user logged in");
                // If you want to redirect to login, ensure you have access to a router or history object here
                // router.push('/login');
            }
        };

        fetchUserData();
    }, []);

    useEffect(() => {
        setIsLoading(true);
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                const fetchLetters = async () => {
                    try {
                        const userDocRef = doc(collection(db, "users"), auth.currentUser.uid);
                        // const userDocSnapshot = await getDoc(userDocRef);
                        const lettersRef = collection(db, "letterbox");
                        const letterboxQuery = query(lettersRef, where("members", "array-contains", userDocRef));
                        const letterboxQuerySnapshot = await getDocs(letterboxQuery);

                        const fetchedLetters = letterboxQuerySnapshot.docs.map(doc => ({
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
    // This empty dependency array means the effect runs once on component mount.


    return (
        <div className="bg-gray-100 min-h-screen py-6">
            <div className="max-w-lg mx-auto bg-white shadow-md rounded-lg overflow-hidden">
                {/* Header */}
                <header className="flex justify-between items-center bg-blue-100 p-5 border-b border-gray-200">
                    {/* User Info */}
                    <Link href="/profile">
                        <button className="flex items-center text-gray-700">
                            <FaUserCircle className="h-8 w-8" />
                            <div className="ml-3">
                                <div className="font-semibold text-lg">{userName}</div>
                                <div className="text-sm text-gray-600">{country}</div>
                            </div>
                        </button>
                    </Link>
                    {/* Icons */}
                    <div className="flex items-center space-x-4">
                        <Link href="/settings">
                            <button className="text-gray-700 hover:text-blue-600"><FaCog className="h-7 w-7" /></button>
                        </Link>
                        <Link href="/discover">
                            <button className="text-gray-700 hover:text-blue-600"><FaBell className="h-7 w-7" /></button>
                        </Link>
                        <Link href="/letterwrite">
                            <button className="text-gray-700 hover:text-blue-600"><FaPen className="h-7 w-7" /></button>
                        </Link>
                    </div>
                </header>
                {/* Main content */}
                <main className="p-6">

                    {/* Last Letters */}
                    <section className="mt-8">
                        <h2 className="font-bold text-xl mb-4 text-gray-800 flex justify-between items-center">
                            Last letters
                            <Link href="/letterhome">
                                <button className="px-3 py-1 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-300">Show more</button>
                            </Link>
                        </h2>
                        {letters.length > 0 ? (
                            letters.map((letter) => (
                                <div key={letter.id} className="flex items-center p-4 mb-3 rounded-lg bg-white shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer" onClick={() => handleLetterClick(letter)}>
                                    <div className="w-12 h-12 relative mr-4">
                                        <Image src="/usericon.png" alt="Sender" layout="fill" className="rounded-full" />
                                    </div>
                                    <div className="flex-grow">
                                        <h3 className="font-semibold text-gray-800">From: {letter.senderName || 'Unknown'}</h3>
                                        <p className="text-gray-600 truncate">{letter.content}</p>
                                        <span className="text-xs text-gray-400">{letter.received}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500">No letters found.</p>
                        )}
                    </section>

                </main>
                <BottomNavBar />
            </div>
        </div>
    );
}
