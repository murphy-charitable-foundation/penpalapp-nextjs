"use client"

// pages/contact.js
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import logo from '/public/murphylogo.png';
import { FaInstagram, FaLinkedinIn, FaEnvelope, FaGlobe } from 'react-icons/fa';
import BottomNavBar from '../../components/bottom-nav-bar';
import { BackButton } from '../../components/general/BackButton';
import Button from '../../components/general/Button';

export default function Contact() {
    const socialLinks = [['Instagram', 'https://www.instagram.com/murphycharity_/'],
  ['Linkedin', 'https://www.linkedin.com/company/murphy-charitable-foundation-uganda'],
  ['Email', 'mailto:rez@murphycharity.org'],
  ['Website', 'https://murphycharity.org']];

    return (
        <div className="min-h-screen bg-gray-100 p-4 flex flex-col items-center justify-center">
            <div className="bg-blue-700 shadow rounded-lg p-6 w-full max-w-md">
                <BackButton />
                <div className="my-4 flex justify-center">
                    <Image src={logo} alt="Foundation Logo" width={100} height={100} /> {/* Adjust the path and size as needed */}
                </div>
                <h1 className="text-3xl font-bold text-center mb-1 text-white">Murphy Charitable Foundation Uganda</h1>
                <p className="text-center text-lg text-gray-100 mb-6">Reach out to us here</p>

                <div className="space-y-6">
                    {socialLinks.map(([platform, url]) => (
                        <Button
                            key={platform}
                            btnText={
                            <div className="flex items-center">
                                {platform === 'Instagram' && <FaInstagram className="h-6 w-6" />}
                                {platform === 'Linkedin' && <FaLinkedinIn className="h-6 w-6" />}
                                {platform === 'Email' && <FaEnvelope className="h-6 w-6" />}
                                {platform === 'Website' && <FaGlobe className="h-6 w-6" />}
                                <span className="ml-3 capitalize">{platform}</span>
                            </div>
                            }
                            onClick={() => window.open(url, "_blank")}
                        />
                    ))}
                    {/* Instagram */}
                    
                </div>
            </div>
            <BottomNavBar />
        </div>
    );
}
