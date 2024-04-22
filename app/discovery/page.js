"use client"

// pages/choose-kid.js
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { db } from '../firebaseConfig'; // Ensure this path is correct
import { collection, getDocs } from 'firebase/firestore';
import { differenceInCalendarYears } from 'date-fns';
import BottomNavBar from '@/components/bottom-nav-bar';
import KidCard from '@/components/general/KidCard';


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
            console.log(kidsList)
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

<div className="flex flex-col sm:flex-row sm:justify-between sm:bg-[#034078]">
    {/* Top part with white background and black text */}
    <div className="p-4 flex items-center justify-between text-black sm:text-white bg-white sm:bg-[#034078]">
        <div className="flex gap-4 justify-center w-full">
            <button onClick={() => window.history.back()}>
                <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
            </button>
            <h1 className="text-xl sm:text-2xl font-bold text-center">Choose a kid to write to</h1>
        </div>
    </div>

    {/* Filter button with grey background */}
    <div className="p-4 bg-[#E6EDF4] sm:bg-[#034078]">
        <button className="text-black sm:text-white w-full px-3 py-1 rounded-full text-sm flex items-center justify-between sm:justify-center sm:bg-[#022f5b] text-[15px] sm:text-[18px]">
            <p>Filters</p>
            <svg className="w-6 h-7 ml-2 fill-current" viewBox="0 0 20 20">
                <path d="M5.95 6.95l4 4 4-4 .707.708L10 12.364 5.242 7.657l.707-.707z" />
            </svg>
        </button>
    </div>
</div>

        <div className="px-4 py-2 flex flex-row flex-wrap gap-5 justify-center relative">
        {kids.map((kid) => (
            <KidCard
            kid={kid}
            calculateAge={calculateAge}
            key={kid?.id}
            style={{ minHeight: "300px", minWidth: "280px" }} // Adjust min-height and min-width as needed
            />
        ))}
        </div>

            </div>
            <BottomNavBar />
        </div>

    );
}