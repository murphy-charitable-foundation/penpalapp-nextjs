"use client"

// pages/choose-kid.js
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

export default function ChooseKid() {
    // Dummy data for the kids' profiles
    const kids = [
        {
            name: 'Louise',
            age: 13,
            interests: ['History', 'Pet Lover', 'Football'],
            image: '/usericon.png', 
        },
        {
            name: 'Adiel',
            age: 10,
            interests: ['Math', 'Capoeira'],
            image: '/usericon.png', 
        },
        {
            name: 'Adiel',
            age: 10,
            interests: ['Math', 'Capoeira'],
            image: '/usericon.png', 
        },
        {
            name: 'Adiel',
            age: 10,
            interests: ['Math', 'Capoeira'],
            image: '/usericon.png', 
        },
        {
            name: 'Adiel',
            age: 10,
            interests: ['Math', 'Capoeira'],
            image: '/usericon.png', 
        },
        {
            name: 'Adiel',
            age: 10,
            interests: ['Math', 'Capoeira'],
            image: '/usericon.png',
        },
        {
            name: 'Adiel',
            age: 10,
            interests: ['Math', 'Capoeira'],
            image: '/usericon.png', 
        },
        {
            name: 'Adiel',
            age: 10,
            interests: ['Math', 'Capoeira'],
            image: '/usericon.png', 
        },
        {
            name: 'Adiel',
            age: 10,
            interests: ['Math', 'Capoeira'],
            image: '/usericon.png', 
        },
        {
            name: 'Adiel',
            age: 10,
            interests: ['Math', 'Capoeira'],
            image: '/usericon.png', 
        },
        {
            name: 'Adiel',
            age: 10,
            interests: ['Math', 'Capoeira'],
            image: '/usericon.png', 
        },
        {
            name: 'Adiel',
            age: 10,
            interests: ['Math', 'Capoeira'],
            image: '/usericon.png', 
        },
        {
            name: 'Adiel',
            age: 10,
            interests: ['Math', 'Capoeira'],
            image: '/usericon.png', 
        },
        
    ];

    return (
        <div className="min-h-screen bg-gray-100 p-4">
            <div className="bg-white shadow rounded-lg">
                
                <div className="text-center py-4 border-b border-gray-300">
                    <h1 className="text-xl font-bold text-black">Choose a kid to write to</h1>
                </div>

                
                <div className="overflow-x-auto whitespace-nowrap py-4">
                    {kids.map((kid, index) => (
                        <div key={index} className="inline-block w-60 mx-2 bg-white p-2 rounded-lg shadow-md">
                            <Image src={kid.image} alt={kid.name} width={200} height={200} className="rounded-lg" />
                            <h2 className="font-bold text-lg mt-2">{kid.name}</h2>
                            <p className="text-red-500 truncate">I'm a fun and intelligent girl</p>
                            <p className="text-yellow-500">{kid.age} years</p>
                            <div className="my-2 flex flex-wrap">
                                {kid.interests.map((interest, idx) => (
                                    <span key={idx} className="inline-block bg-[#075EA6] rounded-full px-3 py-1 text-sm font-semibold text-white mr-2 mb-2">
                                        {interest}
                                    </span>
                                ))}
                            </div>
                            <Link href="/letterwrite">
                            <button className="w-full bg-blue-600 text-white py-2 rounded-lg">
                                Send a chat
                            </button>
                            </Link>
                        </div>
                    ))}
                </div>

                <div className="text-center py-4">
                    <Link href="/next-page">
                        <button className="text-gray-500 underline">Skip for now</button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
