"use client"

// pages/donate.js
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

export default function Donate() {
    const details = [
        { label: "Account Name", value: "Murphy Charitable Foundation" },
        { label: "Account Number", value: "01113657970966" },
        { label: "Bank Name", value: "Dfcu Bank Uganda" },
        { label: "Swift Code", value: "DFCUUGKA" },
        { label: "PayPal", value: "https://www.paypal.com/donate/?hosted_button_id=5AFEFHRYLY558" },
    ];


    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
            <div className="max-w-2xl w-full mb-8">
            <Link href="/login">
                <button>
                    <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
            </Link>
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="p-6">
                        <h2 className="text-center text-4xl text-blue-600 font-bold mb-6">Donate</h2>

                        <p className="text-gray-700 text-lg leading-relaxed">
                            Your generosity makes our work possible. Whether you contribute financially or as advocate for good, you make a real difference.
                        </p>

                        <div className="mt-6 text-center">
                            <Link href="/donation-page">
                                <button className="inline-block text-white bg-blue-600 hover:bg-blue-700 font-semibold py-3 px-6 rounded-md transition duration-300">
                                    Make a Donation
                                </button>
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
        </div>
    );
}

