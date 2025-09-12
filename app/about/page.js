"use client"

// pages/about.js
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import BottomNavBar from '../../components/bottom-nav-bar';
import { BackButton } from '../../components/general/BackButton';
import { PageBackground } from '../../components/general/PageBackground';
import { PageContainer } from '../../components/general/PageContainer';
export default function About() {
    return (
        <PageBackground className="flex flex-col items-center justify-center p-4 pb-20">
            <PageContainer maxWidth="xxl">
                <BackButton />
                <div className="p-6">
                    <h2 className="text-center text-4xl text-blue-600 font-bold mb-6">About Us</h2>
                </div>
                <div className="h-[290px] bg-cover bg-bottom bg-no-repeat rounded-lg" style={{backgroundImage: `url("/about/about-asset-1.jpg")`}}></div>
                <div className="p-6">
                    <p className="text-gray-700 text-lg leading-relaxed mb-4">
                    At Murphy Charitable Foundation Uganda, we are committed to alleviating poverty and improving health and education in the communities we serve.
                    </p>
                    <p className="text-gray-700 text-lg leading-relaxed mb-4">
                    Our journey began with a profound understanding of the challenges faced by individuals living in extreme poverty.
                    </p>
                    <p className="text-gray-700 text-lg leading-relaxed mb-4">
                    Inspired by their resilience and motivated to make a difference, we dedicate ourselves to addressing the needs and rights of vulnerable populations in rural areas by tackling critical social and economic issues.
                    </p>
                    <p className="text-gray-700 text-lg leading-relaxed">
                    We focus on implementing sustainable, high-impact projects that enhance education, healthcare, empowerment, and overall community development.
                    </p>
                </div>
                
                <div className="flex flex-wrap">
                    <div className="bg-blue-600 text-white p-6 md:w-1/2 md:flex md:items-center md:rounded-tl-lg md:rounded-bl-lg">
                        <blockquote className="italic text-lg text-center">
                            Together, we can create a brighter future for the children of Uganda.
                        </blockquote>
                    </div>
                    <div 
                        className="
                            h-[290px] bg-cover bg-top bg-no-repeat rounded-lg md:w-1/2 md:rounded-tr-lg md:rounded-br-lg md:rounded-tl-none md:rounded-bl-none
                            " 
                        style={{backgroundImage: `url("/about/about-asset-2.jpg")`}}></div>
                </div>

                <div className="p-6">
                    <h3 className='text-primary font-bold text-lg mb-2'>Our Mission</h3>
                    <p className="text-gray-700 text-lg leading-relaxed mb-8">
                        To Support vulnerable populations by enhancing their access to education, healthcare, and empowerment programs that enable lasting chan
                    </p>
                    <h3 className='text-primary font-bold text-lg mb-2'>Our Vision</h3>
                    <p className="text-gray-700 text-lg leading-relaxed">
                    To build thriving communities where every individual has equitable access to essential resources, fostering both personal growth and collective prosperity
                    </p>
                </div>
                <div className="h-[290px] bg-cover bg-top bg-no-repeat rounded-lg" style={{backgroundImage: `url("/about/about-asset-3.webp")`}}></div>
            </PageContainer>
            <BottomNavBar />
        </PageBackground>
    );
}






