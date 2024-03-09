"use client"


// pages/index.js
import Image from 'next/image';
import { useState } from 'react';
import Link from 'next/link';

import ProfileIcon from '/public/homeicon.png';
import LetterIcon from '/public/lettericon.png';
import DiscoverIcon from '/public/discovericon.png';
import AboutIcon from '/public/abouticon.png';
import ContactIcon from '/public/contacticon.png';
import DonateIcon from '/public/donateicon.png';
import SettingsIcon from '/public/settingsicon.png';
import NotifyIcon from '/public/notifyicon.png';
import WriteIcon from '/public/writeicon.png';



export default function Home() {
    // Dummy data for the lists
    const recentChildren = [
        { name: 'Louise', image: '/usericon.png' },
        { name: 'Mark', image: '/usericon.png' },
        { name: 'Pierre', image: '/usericon.png' },
        { name: 'John', image: '/usericon.png' },
    ];

    const lastLetters = [
        {
            from: 'Louise Parlermo',
            country: 'Uganda',
            message: 'Hey there, How is it going? I saw you pictures in Italy. They look amazing. Lorem ipsum dolor sit amet...',
            image: '/usericon.png',
            status: 'read', 
        },
    ];



    const meetKids = [
        {
            name: 'Louise Perdomo',
            image: '/usericon.png', 
            details: '8, male, Uganda',
            interests: ['Math', 'Zoo', 'Capoeira'],
        },
        {
            name: 'Ethan Mbappe',
            image: '/usericon.png',
            details: '9, male, Kenya',
            interests: ['Science', 'Football', 'Music'],
        },
        {
            name: 'Amelia Nkechi',
            image: '/usericon.png', 
            details: '7, female, Nigeria',
            interests: ['Art', 'Dance', 'Nature'],
        },
        {
            name: 'Miguel Esteban',
            image: '/usericon.png', 
            details: '10, male, Colombia',
            interests: ['Coding', 'Chess', 'Books'],
        },

    ];




    return (
        <div className="bg-gray-100 min-h-screen">
            <div className="max-w-md mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
                {/* Header */}
                <header className="flex justify-between items-center bg-[#F8F8F8] p-4 border-b border-gray-300">
                    {/* User Info */}
                    <Link href="/login">

                        <button>
                            <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                    </Link>
                    <div className="flex items-center">
                        <Image src="/usericon.png" alt="Jack Doe" width={50} height={50} className="rounded-full border-2 border-teal-500" />
                        <div className="ml-2">
                            <div className="font-semibold text-black">Jack Doe</div>
                            <div className="text-sm text-gray-500">Mexico</div>
                        </div>
                    </div>
                    {/* Icons */}
                    <div className="flex items-center space-x-3">
                        {/* Settings Icon */}
                        <Link href="/settings">
                            <button className="flex flex-col items-center">
                                {/* Home Icon */}
                                <Image src={SettingsIcon} alt="Home" className="h-6 w-6" />
                            </button>
                        </Link>
                        {/* Notification Icon */}
                        <Link href="/discover">
                            <button className="flex flex-col items-center">
                                {/* Home Icon */}
                                <Image src={NotifyIcon} alt="Home" className="h-6 w-6" />
                            </button>
                        </Link>
                        {/* Write Icon */}
                        <Link href="/letterwrite">
                            <button className="flex flex-col items-center">
                                {/* Home Icon */}
                                <Image src={WriteIcon} alt="Home" className="h-6 w-6" />
                            </button>
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
                        <h2 className="font-bold text-lg mb-3 text-black">Last letters (2)</h2>
                        {lastLetters.map((letter, index) => (
                            <div
                                key={index}
                                className="flex items-center space-x-3 mb-3 p-3 rounded-lg transition-all duration-300 ease-in-out
                       bg-[#94c1f2] hover:bg-[#7dafe6] hover:shadow-lg"
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

                    <section className="mt-6">
                        {lastLetters.map((letter, index) => (
                            <div
                                key={index}
                                className="flex items-center space-x-3 mb-3 p-3 rounded-lg transition-all duration-300 ease-in-out
                       bg-[#94c1f2] hover:bg-[#7dafe6] hover:shadow-lg"
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
                            <Link href="/kids">
                                <button className="text-blue-600 text-black">Show All</button>
                            </Link>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-4">
                            {meetKids.map((kid, index) => (
                                <div key={index} className="flex flex-col items-center text-black bg-[#94c1f2] p-3 rounded-lg shadow">
                                    <Image src={kid.image} alt={kid.name} width={70} height={70} className="rounded-full" />
                                    <div className="text-center ">
                                        <div className="font-bold text-black">{kid.name}</div>
                                        <div className="text-sm text-black">{kid.details}</div>
                                        {/* Tags for kid's interests */}
                                        <div className="flex space-x-1 mt-1">
                                            {kid.interests.map((interest, idx) => (
                                                <span key={idx} className="text-xs font-medium bg-gray-200 p-1 rounded-full bg-[#075EA6] text-black">
                                                    {interest}
                                                </span>
                                            ))}
                                        </div>
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
                            {/* Home Icon */}
                            <Image src={ProfileIcon} alt="Home" className="h-6 w-6" />
                            <span className="text-xs">Profile</span>
                        </button>
                    </Link>
                    <Link href="/letterwrite">
                        <button className="flex flex-col items-center relative">
                            {/* Letter Icon */}
                            <Image src={LetterIcon} alt="Home" className="h-6 w-6" />
                            <span className="text-xs">Letter</span>
                        </button>
                    </Link>
                    <Link href="/discovery">
                        <button className="flex flex-col items-center">
                            {/* Discovery Icon */}
                            <Image src={DiscoverIcon} alt="Home" className="h-6 w-6" />
                            <span className="text-xs">Discover</span>
                        </button>
                    </Link>
                    <Link href="/donate">
                        <button className="flex flex-col items-center">
                            {/* Donation Icon */}
                            <Image src={DonateIcon} alt="Home" className="h-6 w-6" />
                            <span className="text-xs">Donate</span>
                        </button>
                    </Link>
                    <Link href="/about">
                        <button className="flex flex-col items-center">
                            {/* Donation Icon */}
                            <Image src={AboutIcon} alt="Home" className="h-6 w-6" />
                            <span className="text-xs">About</span>
                        </button>
                    </Link>
                    <Link href="/contact">
                        <button className="flex flex-col items-center">
                            {/* Donation Icon */}
                            <Image src={ContactIcon} alt="Home" className="h-6 w-6" />
                            <span className="text-xs">Contact</span>
                        </button>
                    </Link>
                </nav>
            </div>
        </div>
    );
}
