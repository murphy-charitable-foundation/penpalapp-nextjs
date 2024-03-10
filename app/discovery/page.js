"use client"

// pages/choose-kid.js
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { db } from '../firebaseConfig'; // Ensure this path is correct
import { collection, getDocs } from 'firebase/firestore';
import { differenceInCalendarYears } from 'date-fns';

export default function ChooseKid() {
    const [kids, setKids] = useState([]);

    useEffect(() => {
        const fetchKids = async () => {
            const usersCollectionRef = collection(db, "users");
            const snapshot = await getDocs(usersCollectionRef);
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

    return (
        <div className="min-h-screen p-4" style={{ backgroundColor: '#f0f2f5' }}>
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <div className="p-4 flex justify-between items-center" style={{ backgroundColor: '#034078' }}>
                    <h1 className="text-2xl font-bold text-white">Choose a kid to write to</h1>
                    <button className="text-white px-3 py-1 rounded-full text-sm flex items-center justify-center" style={{ backgroundColor: '#022f5b' }}>
                        Filters
                        <svg className="w-4 h-4 ml-2 fill-current" viewBox="0 0 20 20">
                            <path d="M5.95 6.95l4 4 4-4 .707.708L10 12.364 5.242 7.657l.707-.707z" />
                        </svg>
                    </button>
                </div>

                <div className="px-4 py-2 flex flex-col items-center relative">


                    {/* Card components */}
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
            </div>
        </div>

    );
}