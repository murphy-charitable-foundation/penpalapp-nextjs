"use client";

// pages/about.js
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import BottomNavBar from "../../components/bottom-nav-bar";
import { BackButton } from "../../components/general/BackButton";
import { PageBackground } from "../../components/general/PageBackground";
import { PageContainer } from "../../components/general/PageContainer";
export default function About() {
    return (
        <PageBackground className="flex flex-col items-center justify-center p-4 pb-20">
            <PageContainer maxWidth="xxl">
                <BackButton />
                <div className="!mt-0">
                    <h1 className="flex-grow text-center font-medium text-gray-800">About Us</h1>
                </div>
                <div className="bg-secondary text-white p-6 rounded-lg">
                    <blockquote className="font-medium italic text-center">
                        Together, we can create a brighter future for the children of Uganda.
                    </blockquote>
                </div>
                <div className="px-6">
                    <p className="leading-relaxed mb-4">
                    At Murphy Charitable Foundation Uganda, we are committed to alleviating poverty and improving health and education in the communities we serve.
                    </p>
                    <p className="leading-relaxed mb-4">
                    Our journey began with a profound understanding of the challenges faced by individuals living in extreme poverty.
                    </p>
                    <p className="leading-relaxed mb-4">
                    Inspired by their resilience and motivated to make a difference, we dedicate ourselves to addressing the needs and rights of vulnerable populations in rural areas by tackling critical social and economic issues.
                    </p>
                    <p className="leading-relaxed">
                    We focus on implementing sustainable, high-impact projects that enhance education, healthcare, empowerment, and overall community development.
                    </p>
                </div>
                
                <div className='flex wrap flex-col md:flex-row'>
                    <div className="h-[290px] bg-cover bg-top bg-no-repeat rounded-lg md:w-1/2 md:h-auto" 
                        style={{backgroundImage: `url("/about/about-asset-2.jpg")`}}></div>

                    <div className="p-6 md:w-1/2">
                        <h3 className='text-secondary font-bold text-md mb-2'>Our Mission</h3>
                        <p className="leading-relaxed mb-8">
                            To Support vulnerable populations by enhancing their access to education, healthcare, and empowerment programs that enable lasting chan
                        </p>
                        <h3 className='text-secondary font-bold text-md mb-2'>Our Vision</h3>
                        <p className="leading-relaxed">
                        To build thriving communities where every individual has equitable access to essential resources, fostering both personal growth and collective prosperity
                        </p>
                    </div>
                </div>
                
                <div className="h-[290px] bg-cover bg-top bg-no-repeat rounded-lg" style={{backgroundImage: `url("/about/about-asset-3.webp")`}}></div>
            </PageContainer>
            <BottomNavBar />
        </PageBackground>
    );
}
