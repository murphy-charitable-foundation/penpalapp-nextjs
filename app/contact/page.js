"use client"

// pages/contact.js
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import logo from "/public/murphylogo.png";
import { FaInstagram, FaLinkedinIn, FaEnvelope, FaGlobe } from "react-icons/fa";
import BottomNavBar from "@/components/bottom-nav-bar";
import { usePageAnalytics } from "@/app/utils/useAnalytics";
import { logButtonEvent, logLoadingTime } from "@/app/utils/analytics";
import { useEffect } from "react";
export default function Contact() {
  const socialLinks = {
    instagram: 'https://www.instagram.com/murphycharity_/',
    linkedin: 'https://www.linkedin.com/company/murphy-charitable-foundation-uganda',
    email: 'mailto:rez@murphycharity.org',
    website: 'https://murphycharity.org'
  };
  usePageAnalytics("/contact");
  useEffect(() => {
    const startTime = performance.now();
    requestAnimationFrame(() => {
      setTimeout(() => {
        const endTime = performance.now();
        const loadTime = endTime - startTime;
        console.log(`Page render time: ${loadTime}ms`);
        logLoadingTime("/contact", loadTime);
      }, 0);
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-4 flex flex-col items-center justify-center">
        <div className="bg-[#075EA6] shadow rounded-lg p-6 w-full max-w-md">
        <button onClick={() => window.history.back()}>
                <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
            </button>
            <div className="my-4 flex justify-center">
                <Image src={logo} alt="Foundation Logo" width={100} height={100} /> {/* Adjust the path and size as needed */}
            </div>
            <h1 className="text-3xl font-bold text-center mb-1 text-white">Murphy Charitable Foundation Uganda</h1>
            <p className="text-center text-lg text-gray-100 mb-6">Reach out to us here</p>

            <div className="space-y-6">
                {/* Instagram */}
                <Link href={socialLinks.instagram}>
                    <button className="flex justify-center items-center text-white hover:text-[#cfe899] py-4">
                        <FaInstagram className="h-6 w-6" />
                        <span className="ml-6">Instagram</span>
                    </button>
                </Link>
                {/* LinkedIn */}
                <Link href={socialLinks.linkedin}>
                    <button className="flex justify-center items-center text-white hover:text-[#cfe899] py-4">
                        <FaLinkedinIn className="h-6 w-6" />
                        <span className="ml-6">LinkedIn</span>
                    </button>
                </Link>
                {/* Email */}
                <Link href={`mailto:${socialLinks.email}`}>
                    <button className="flex justify-center items-center text-white hover:text-[#cfe899] py-4">
                        <FaEnvelope className="h-6 w-6" />
                        <span className="ml-6">Email</span>
                    </button>
                </Link>
                {/* Website */}
                <Link href={socialLinks.website}>
                    <button className="flex justify-center items-center text-white hover:text-[#cfe899] py-4">
                        <FaGlobe className="h-6 w-6" />
                        <span className="ml-6">Website</span>
                    </button>
                </Link>
            </div>
        </div>
        <BottomNavBar />
    </div>
  );
}
