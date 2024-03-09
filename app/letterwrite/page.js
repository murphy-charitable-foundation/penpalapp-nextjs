
"use client"


// pages/write-letter.js
import Image from 'next/image';
import { useState } from 'react';
import Link from 'next/link';
import FilesIcon from '/public/filesicon.png';
import VoiceIcon from '/public/voiceicon.png';
import SendIcon from '/public/sendicon.png';

export default function WriteLetter() {
    const [letterContent, setLetterContent] = useState("");

    return (
        <div className="min-h-screen bg-[#E5E7EB] p-4"> 
            <div className="bg-white shadow rounded-lg">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-300 bg-[#FAFAFA]"> 
                <Link href="/">
                    <button>
                        <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                </Link>
                    <h1 className="text-xl font-bold text-center flex-grow text-black">Write a letter</h1>
                    <button className="opacity-0">{"<"}</button> 
                </div>

                {/* Recipient Info */}
                <div className="flex items-center space-x-3 p-4 bg-[#F3F4F6] rounded-t-lg">
                    <Image src="/usericon.png" alt="Recipient Name" width={50} height={50} className="rounded-full border-2 border-teal-500" />
                    <div>
                        <h2 className="font-bold text-black">Re: Louise Palermo</h2>
                        <p className="text-sm text-gray-500">Uganda</p>
                    </div>
                </div>

                {/* Text Area */}
                <textarea
                    className="w-full p-4 text-black bg-[#ffffff] rounded-lg border-teal-500"
                    rows="8"
                    placeholder="Tap to write letter..."
                    value={letterContent}
                    onChange={(e) => setLetterContent(e.target.value)}
                />

                {/* Attachments and Actions */}
                <div className="flex justify-between items-center p-4 bg-[#F3F4F6] border-t border-gray-300">
                    <span className="text-black">0 files</span>
                    <div className="space-x-2">
                        
                        <button className="text-black p-2 rounded-full">
                        <Image src={FilesIcon} alt="Home" className="h-6 w-6" />
                        </button>
                        <button className="text-black p-2 rounded-full">
                        <Image src={VoiceIcon} alt="Home" className="h-6 w-6" />
                        </button>
                        <button className="text-black p-2 rounded-full">
                        <Image src={SendIcon} alt="Home" className="h-6 w-6" />
                        </button>
                    </div>
                </div>

                {/* Character Count */}
                <div className="text-right text-sm p-4 text-gray-600">{letterContent.length} / 500</div>
            </div>
        </div>
    );
}
