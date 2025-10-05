"use client";

// pages/contact.js
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import logo from "/public/murphylogo.png";
import { FaInstagram, FaLinkedinIn, FaEnvelope, FaGlobe } from "react-icons/fa";
import BottomNavBar from "../../components/bottom-nav-bar";
import { BackButton } from "../../components/general/BackButton";
<<<<<<< HEAD
import Button from "../../components/general/Button";
import { usePageAnalytics } from "../useAnalytics";
import { logButtonEvent, logLoadingTime } from "../utils/analytics";
import { useEffect } from "react";
=======
import { PageBackground } from "../../components/general/PageBackground";
import { PageContainer } from "../../components/general/PageContainer";
import { PageHeader } from "../../components/general/PageHeader";
>>>>>>> 08e89be (page bg, container, and header)

export default function Contact() {
  const socialLinks = [
    {
      name: "Instagram",
      url: "https://www.instagram.com/murphycharity_/",
      icon: <FaInstagram className="h-6 w-6" />,
    },
    {
      name: "Linkedin",
      url: "https://www.linkedin.com/company/murphy-charitable-foundation-uganda",
      icon: <FaLinkedinIn className="h-6 w-6" />,
    },
    {
      name: "Email",
      url: "mailto:rez@murphycharity.org",
      icon: <FaEnvelope className="h-6 w-6" />,
    },
    {
      name: "Website",
      url: "https://murphycharity.org",
      icon: <FaGlobe className="h-6 w-6" />,
    },
  ];
  usePageAnalytics("/contact");

<<<<<<< HEAD
  return (
    <div className="min-h-screen bg-gray-100 p-4 flex flex-col items-center justify-center">
      <div className="bg-blue-700 shadow rounded-lg p-6 w-full max-w-md">
        <BackButton />
        <div className="my-4 flex justify-center">
          <Image src={logo} alt="Foundation Logo" width={100} height={100} />{" "}
          {/* Adjust the path and size as needed */}
        </div>
        <h1 className="text-3xl font-bold text-center mb-1 text-white">
          Murphy Charitable Foundation Uganda
        </h1>
        <p className="text-center text-lg text-gray-100 mb-6">
          Reach out to us here
        </p>

        <div className="space-y-6">
          {socialLinks.map((link) => (
            <Button
              key={link.name}
              btnText={
                <div className="flex items-center">
                  {link.icon}
                  <span className="ml-3 capitalize">{link.name}</span>
=======
    return (
        <PageBackground>
            <PageContainer maxWidth="lg">
            
                <PageHeader title="Contact Us" />
                <div>
                    <div className="w-40 h-40 mx-auto rounded-full bg-cover bg-center bg-no-repeat" style={{backgroundImage: `url("/contact-asset-1.jpg")`}}></div>
>>>>>>> 08e89be (page bg, container, and header)
                </div>
              }
              onClick={() => window.open(link.url, "_blank")}
            />
          ))}
          {/* Instagram */}
        </div>
      </div>
      <BottomNavBar />
    </div>
  );
}
