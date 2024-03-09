"use client"

// pages/contact.js
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import logo from '/public/murphylogo.png';

export default function Contact() {
    const socialLinks = {
        instagram: 'https://www.instagram.com/murphycharity_/',
        linkedin: 'https://www.linkedin.com/company/murphy-charitable-foundation-uganda/mycompany/verification/',
        email: 'mailto:rez@murphycharity.org',
        website: 'https://https://murphycharity.org'
    };

    return (
        <div className="min-h-screen bg-gray-100 p-4 flex flex-col items-center justify-center">
            <div className="bg-[#075EA6] shadow rounded-lg p-6 w-full max-w-md">
            <Link href="/login">
                <button>
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
            </Link>
                <div className="my-4 flex justify-center">
                    <Image src={logo} alt="Foundation Logo" width={100} height={100} /> {/* Adjust the path and size as needed */}
                </div>
                <h1 className="text-3xl font-bold text-center mb-1 text-white">Murphy Charitable Foundation Uganda</h1>
                <p className="text-center text-lg text-gray-100 mb-6">Reach out to us here</p>

                <div className="space-y-6">
                    {/* Instagram */}
                    <a href={socialLinks.instagram} className="flex justify-center items-center text-white hover:text-[#cfe899]">
                        <Image src="/instagram.png" alt="Instagram" width={24} height={24} />
                        <span className="ml-2">Instagram</span>
                    </a>
                    {/* LinkedIn */}
                    <a href={socialLinks.linkedin} className="flex justify-center items-center text-white hover:text-[#cfe899]">
                        <Image src="/linkedin.png" alt="LinkedIn" width={24} height={24} />
                        <span className="ml-2">LinkedIn</span>
                    </a>
                    {/* Email */}
                    <a href={socialLinks.email} className="flex justify-center items-center text-white hover:text-[#cfe899]">
                        <Image src="/email.png" alt="Email" width={24} height={24} />
                        <span className="ml-2">Email</span>
                    </a>
                    {/* Website */}
                    <a href={socialLinks.website} className="flex justify-center items-center text-white hover:text-[#cfe899]">
                        <Image src="/website.png" alt="Website" width={24} height={24} />
                        <span className="ml-2">Website</span>
                    </a>
                </div>
            </div>
        </div>
    );
}
