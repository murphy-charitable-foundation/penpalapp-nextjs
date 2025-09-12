"use client"

// pages/donate.js
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import BottomNavBar from '../../components/bottom-nav-bar';
import Button from '../../components/general/Button';
import { BackButton } from '../../components/general/BackButton';
export default function Donate() {
    const details = [
        { label: "Account Name", value: "Murphy Charitable Foundation" },
        { label: "Account Number", value: "01113657970966" },
        { label: "Bank Name", value: "Dfcu Bank Uganda" },
        { label: "Swift Code", value: "DFCUUGKA" },
    ];

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
            <div className="max-w-2xl w-full mb-8">
                <Link href="letterhome">
                    <BackButton />
                </Link>
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="p-6">
                        <h2 className="text-center text-4xl text-blue-600 font-bold mb-4">Sponsor a Child</h2>

                        <p className="text-gray-700 text-lg leading-relaxed">
                            Your generosity makes our work possible. Whether you contribute financially or as advocate for good, you make a real difference.
                        </p>
                        <p className="text-gray-700 text-xs leading-relaxed mt-4 italic">
                            You may include a note to indicate your preferred category:
                        </p>
                        <p className="text-gray-700 text-xs leading-relaxed italic">
                            Education, Beddings & Clothing, Medical Care, or Scholastic Materials.
                        </p>

                        <div className="mt-4 text-center">
                            <Link
                             href="https://www.every.org/murphy-charitable-foundation-uganda?utm_campaign=donate-link#/donate/card"
                             target="_blank"
                            >
                                <Button
                                    btnText="Sponsor Now"
                                />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment Details Section */}
            <div className="bg-blue-600 rounded-xl shadow-lg p-6 max-w-2xl w-full">
                <h2 className="text-center text-3xl text-white font-bold mb-6">Payment Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {details.map((detail, index) => (
                        <div key={index} className="bg-white rounded-lg p-6 shadow-lg">
                            <h3 className="text-lg text-blue-600 font-bold">{detail.label}</h3>
                            <p className="text-md mt-2 text-gray-800">{detail.value}</p>
                        </div>
                    ))}
                </div>
            </div>
            <BottomNavBar />
        </div>
    );
}
