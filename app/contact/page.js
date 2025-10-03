"use client"

// pages/contact.js
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import logo from '/public/murphylogo.png';
import { FaInstagram, FaLinkedinIn, FaEnvelope, FaGlobe, FaPhoneAlt, FaFacebookF, FaWhatsapp } from 'react-icons/fa';
import BottomNavBar from '../../components/bottom-nav-bar';
import { BackButton } from '../../components/general/BackButton';
import Button from '../../components/general/Button';
import { PageBackground } from '../../components/general/PageBackground';
import { PageContainer } from '../../components/general/PageContainer';

export default function Contact() {
    const socialLinks = [
        {
            name: 'WhatsApp/phone',
            url:  'tel:+256771983900',
            icon: <FaWhatsapp className="h-6 w-6" />,
        },
        {
            name: 'Email',
            url:  'mailto:murphycharity.info@gmail.com',
            icon: <FaEnvelope className="h-6 w-6" />,
        },
        {
            name: 'Linkedin',
            url:  'https://www.linkedin.com/company/murphy-charitable-foundation-uganda',
            icon:  <FaLinkedinIn className="h-6 w-6" />, 
        },
        {
            name: 'Facebook',
            url:  'https://www.facebook.com/murphycharityuganda/',
            icon:  <FaFacebookF className="h-6 w-6" />, 
        },
        {
            name: 'Instagram',
            url : 'https://www.instagram.com/murphycharity_/',
            icon: <FaInstagram className="h-6 w-6" />,  
        },
        {
            name: 'Website',
            url:  'https://murphycharity.org',
            icon: <FaGlobe className="h-6 w-6" />,
        }
    ];

    return (
        <PageBackground className="w-full flex flex-col items-center justify-center p-4 pb-20">
            <PageContainer maxWidth="xxl" className='min-[512px]:min-w-[512px]'>
                <BackButton />
            
                <h1 className="font-medium text-center text-black">Contact us</h1>
                <div>
                    <div className="w-40 h-40 mx-auto rounded-full bg-cover bg-center bg-no-repeat" style={{backgroundImage: `url("/contact-asset-1.jpg")`}}></div>
                </div>
                
                <p className="text-gray-600 mb-6 text-center">Reach out to us here</p>
                    
                <div className="space-y-4 w-full @lg:min-w-lg">
                    {socialLinks.map(link => (
                        <Link
                            key={link.name}
                            href={link.url}
                            target="_blank"
                            className="flex items-center px-4 py-3 bg-secondary text-white rounded-lg shadow"
                        >
                            {link.icon}
                            <span className="ml-3">{link.name}</span>    
                        </Link>
                    ))}
                </div>
                <div className="flex flex-wrap items-center gap-2 justify-center">
                    <Image src={logo} alt="Foundation Logo" width={25} height={25} /> {/* Adjust the path and size as needed */}
                    <p className="text-center text-gray-600 text-xs">Murphy Charitable Foundation Uganda</p>
                </div>
            </PageContainer>
            <BottomNavBar />
        </PageBackground>
    );
}
