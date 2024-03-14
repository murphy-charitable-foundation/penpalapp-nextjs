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




import { FaUserCircle, FaRegEnvelope, FaCompass, FaInfoCircle, FaPhone, FaDonate, FaCog, FaBell, FaPen, FaUserAlt, FaHandHoldingHeart, FaInfo, FaEnvelopeOpenText } from 'react-icons/fa';



export default function Home() {
    // Dummy data for the lists
    const recentChildren = [
        { name: 'Louise', image: '/usericon.png' },
        { name: 'Mark', image: '/usericon.png' },
        { name: 'Pierre', image: '/usericon.png' },
        { name: 'John', image: '/usericon.png' },
    ];

    const [meetKids, setMeetKids] = useState([]);

    const [kids, setKids] = useState([]);

    useEffect(() => {
        const fetchKids = async () => {
            const usersCollectionRef = collection(db, "users");
            const q = query(usersCollectionRef, limit(4));
            const snapshot = await getDocs(q);
            const kidsList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            setKids(kidsList);
        };

        fetchKids();
    }, []);

    function calculateAge(birthday) {
        return differenceInCalendarYears(new Date(), new Date(birthday));
    }



    const [userName, setUserName] = useState('');
    const [country, setCountry] = useState('');
    const [lastLetters, setLastLetters] = useState([]);
    const [letters, setLetters] = useState([]);
    const [isLoading, setIsLoading] = useState(false);



    useEffect(() => {
        const fetchUserData = async () => {
            if (auth.currentUser) {
                const uid = auth.currentUser.uid;
                const docRef = doc(db, "users", uid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const userData = docSnap.data();
                    // Assuming the user's name is stored under a 'name' field. Adjust as necessary.
                    setUserName(userData.firstName || 'Unknown User'); // You can adjust this line to concatenate firstName and lastName if you want
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
    // This empty dependency array means the effect runs once on component mount.






    return (
        <div className="bg-gray-100 min-h-screen">
            <div className="max-w-md mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
                {/* Header */}
                <header className="flex justify-between items-center bg-[#F8F8F8] p-4 border-b border-gray-300">
                    {/* User Info */}
                    <Link href="/login">
                        <button className="flex items-center text-gray-600">
                            <FaUserCircle className="h-6 w-6" />
                        </button>
                    </Link>
                    <div className="ml-2">
                        <div className="font-semibold text-black">{userName}</div>
                        <div className="text-sm text-gray-500">{country}</div>
                    </div>
                    {/* Icons */}
                    <div className="flex items-center space-x-3">
                        <Link href="/settings">
                            <button className="text-gray-600"><FaCog className="h-6 w-6" /></button>
                        </Link>
                        <Link href="/discover">
                            <button className="text-gray-600"><FaBell className="h-6 w-6" /></button>
                        </Link>
                        <Link href="/letterwrite">
                            <button className="text-gray-600"><FaPen className="h-6 w-6" /></button>
                        </Link>
                    </div>
                </header>
                {/* Main content */}
                <main className="p-4">
                    {/* Recent Children */}
                    <section>
                        <h2 className="font-bold text-lg mb-3 text-black">Recent children</h2>
                        <div className="flex space-x-3 overflow-auto">
                            {recentChildren.map((child, index) => (
                                <div key={index} className="flex-shrink-0 w-20 h-20 relative">
                                    <Image src={child.image} alt={child.name} layout="fill" className="rounded-full" />
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Last Letters */}
                    <section className="mt-6">
                        <h2 className="font-bold text-lg mb-3 text-black">
                            Last letters (2)
                            <div><Link href="/myletters">
                                <button className="text-blue-600 text-black">Show more</button>
                            </Link></div>
                        </h2>
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
                    </section>


                    <section className="mt-6">
                        {lastLetters.map((letter, index) => (
                            <div
                                key={index}
                                className="flex items-center space-x-3 mb-3 p-3 rounded-lg transition-all duration-300 ease-in-out
                       bg-blue-200 hover:bg-blue-200 hover:shadow-lg"
                            >
                                <div className="flex-shrink-0 w-16 h-16 relative">
                                    <Image src={letter.image} alt={letter.from} layout="fill" className="rounded-full" />
                                    {/* Status Dot */}
                                    <span className={`absolute bottom-0 right-0 block h-3 w-3 ${letter.status === 'read' ? 'bg-green-500' : 'bg-red-500'} rounded-full`}></span>
                                </div>
                                <div className="flex-grow">
                                    <div className="font-bold text-black">{letter.from}</div>
                                    <div className="text-sm text-gray-500">{letter.country}</div>
                                    <div className="text-sm text-black">{letter.message}</div>
                                </div>
                            </div>
                        ))}
                    </section>


                    {/* Meet Some Kids Section */}
                    <section className="mt-6">
                        <div className="flex justify-between items-center">
                            <h2 className="font-bold text-lg text-black">Meet Some Kids</h2>
                            <Link href="/discovery">
                                <button className="text-blue-600 text-black">Show All</button>
                            </Link>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-4">
                            {kids.map((kid) => (
                                <div key={kid.id} className="w-full max-w-sm my-4 p-4 rounded-lg shadow-lg flex flex-col items-start"> {/* Removed center alignment */}
                                    <div className="w-32 h-32 overflow-hidden rounded-full mx-auto"> {/* Profile image container */}
                                        <Image
                                            src={kid.image || '/usericon.png'}
                                            alt={kid.firstName}
                                            width={128}
                                            height={128}
                                            className="object-cover"
                                        />
                                    </div>
                                    <h2 className="text-xl mt-3 mb-1 text-left" style={{ color: '#262626' }}>{kid.firstName}</h2> {/* Text aligned left */}
                                    <p className="text-xs mb-1 text-left text-black">{calculateAge(kid.birthday)} years old</p> {/* Text aligned left */}
                                    <p className="text-left mb-2 text-gray-900 text-xs" style={{ color: '#515151' }}>{kid.bio}</p> {/* Text aligned left */}
                                    <div className="flex justify-start flex-wrap gap-2 mb-4"> {/* Tags container */}
                                        {kid.interests?.map((interest, idx) => (
                                            <span key={idx} className="px-3 py-1 text-xs rounded-full" style={{ backgroundColor: '#fea500', color: 'white' }}>
                                                {interest}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="self-end mt-auto"> {/* Button aligned to the right */}
                                        <Link href="/letterwrite">
                                            <button className="w-28 py-2 rounded-3xl text-center text-xs" style={{ backgroundColor: '#0369a1', color: 'white' }}>
                                                Send a message
                                            </button>
                                        </Link>
                                    </div>
                                </div>
                            ))}

                        </div>
                    </section>

                </main>

                {/* Bottom Navigation */}
                <nav className="fixed inset-x-0 bottom-0 bg-[#cfe899] p-2 flex justify-between text-[#333333] border-t border-[#E6E6E6]">
                    <Link href="/profile">
                        <button className="flex flex-col items-center">
                            <FaUserAlt className="h-6 w-6" />
                            <span className="text-xs">Profile</span>
                        </button>
                    </Link>
                    <Link href="/letterwrite">
                        <button className="flex flex-col items-center">
                            <FaPen className="h-6 w-6" />
                            <span className="text-xs">Letter</span>
                        </button>
                    </Link>
                    <Link href="/discovery">
                        <button className="flex flex-col items-center">
                            <FaCompass className="h-6 w-6" />
                            <span className="text-xs">Discover</span>
                        </button>
                    </Link>
                    <Link href="/donate">
                        <button className="flex flex-col items-center">
                            <FaHandHoldingHeart className="h-6 w-6 color-" />
                            <span className="text-xs">Donate</span>
                        </button>
                    </Link>
                    <Link href="/about">
                        <button className="flex flex-col items-center">
                            <FaInfo className="h-6 w-6" />
                            <span className="text-xs">About</span>
                        </button>
                    </Link>
                    <Link href="/contact">
                        <button className="flex flex-col items-center">
                            <FaEnvelopeOpenText className="h-6 w-6" />
                            <span className="text-xs">Contact</span>
                        </button>
                    </Link>
                </nav>
            </div>
        </div>
    );
}
