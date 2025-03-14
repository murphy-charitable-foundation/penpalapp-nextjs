import React from 'react';
import Link from 'next/link';
import { FaUserAlt, FaPen, FaCompass, FaHandHoldingHeart, FaInfo, FaEnvelopeOpenText, FaHome, FaInbox } from 'react-icons/fa';



const NavBar = () => {
    return(
        <nav className="fixed inset-x-0 bottom-0 bg-[#cfe899] p-3 flex justify-around items-center text-[#333333] border-t border-[#E6E6E6] shadow-md">
            <Link href="/profile">
                <button className="flex flex-col items-center transition-all duration-300 ease-in-out transform hover:scale-110 hover:bg-[#a3d98d] rounded-lg">
                    <FaUserAlt className="h-6 w-6 hover:text-[#666666]" />
                    <span className="text-xs">Profile</span>
                </button>
            </Link>
            <Link href="/letterhome">
                <button className="flex flex-col items-center transition-all duration-300 ease-in-out transform hover:scale-110 hover:bg-[#a3d98d] rounded-lg">
                    <FaHome className="h-6 w-6 hover:text-[#666666]" />
                    <span className="text-xs">Home</span>
                </button>
            </Link>
            <Link href="/letterwrite">
                <button className="flex flex-col items-center transition-all duration-300 ease-in-out transform hover:scale-110 hover:bg-[#a3d98d] rounded-lg">
                    <FaPen className="h-6 w-6 hover:text-[#666666]" />
                    <span className="text-xs">Write Letter</span>
                </button>
            </Link>
            <Link href="/discovery">
                <button className="flex flex-col items-center transition-all duration-300 ease-in-out transform hover:scale-110 hover:bg-[#a3d98d] rounded-lg">
                    <FaCompass className="h-6 w-6 hover:text-[#666666]" />
                    <span className="text-xs">Discover</span>
                </button>
            </Link>
            <Link href="/donate">
                <button className="flex flex-col items-center transition-all duration-300 ease-in-out transform hover:scale-110 hover:bg-[#a3d98d] rounded-lg">
                    <FaHandHoldingHeart className="h-6 w-6 hover:text-[#666666]" />
                    <span className="text-xs">Donate</span>
                </button>
            </Link>
            <Link href="/about">
                <button className="flex flex-col items-center transition-all duration-300 ease-in-out transform hover:scale-110 hover:bg-[#a3d98d] rounded-lg">
                    <FaInfo className="h-6 w-6 hover:text-[#666666]" />
                    <span className="text-xs">About</span>
                </button>
            </Link>
            <Link href="/contact">
                <button className="flex flex-col items-center transition-all duration-300 ease-in-out transform hover:scale-110 hover:bg-[#a3d98d] rounded-lg">
                    <FaEnvelopeOpenText className="h-6 w-6 hover:text-[#666666]" />
                    <span className="text-xs">Contact</span>
                </button>
            </Link>
        </nav>
    );
};

export default NavBar;