
"use client"

import { useState, useEffect } from "react";

import Image from 'next/image';
import Link from 'next/link';
import Button from "../../components/general/Button";


export default function Welcome() {
    const [firstName, setFirstName] = useState('');

    useEffect(() => {
        const value = localStorage.getItem('userFirstName');
        if (value) {
            setFirstName(value);
        }
    }, []);
    return (
        <div className="min-h-screen !bg-primary">
            <div className="max-w-lg mx-auto text-white flex flex-col min-h-screen">
                <div className="relative w-full h-[50vh] bg-[url('/welcome.png')] bg-cover bg-center">
                </div>
                <h3 className='pt-16 text-center w-full font-[700] text-2xl'>
                    Welcome, {firstName}
                </h3>
                <div className='text-center w-full pt-5 flex-1'>
                We are so happy to be here, thanks for your support. Now you are part of the family. 
                </div>
                <div className='text-center w-full pt-10 pb-20'>
                    <Link href="/onboarding-profile">
                        <button className="bg-white text-[#111111] px-16 py-2 rounded-full font-semibold">
                        Continue
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
