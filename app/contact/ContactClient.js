"use client";

import Image from "next/image";
import Link from "next/link";
import logo from "/public/murphylogo.png";
import {
  FaInstagram,
  FaLinkedinIn,
  FaEnvelope,
  FaGlobe,
} from "react-icons/fa";
import BottomNavBar from "../../components/bottom-nav-bar";
import { BackButton } from "../../components/general/BackButton";

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

  return (
    <div className="min-h-screen bg-gray-100 p-4 flex flex-col items-center justify-center">
      <div className="bg-blue-700 shadow rounded-lg p-6 w-full max-w-md">
        <BackButton />

        <div className="my-4 flex justify-center">
          <Image
            src={logo}
            alt="Murphy Charitable Foundation logo"
            width={100}
            height={100}
            priority
          />
        </div>

        <h1 className="text-3xl font-bold text-center mb-1 text-white">
          Murphy Charitable Foundation Uganda
        </h1>

        <p className="text-center text-lg text-gray-100 mb-6">
          Reach out to us here
        </p>

        <div className="space-y-6">
          {socialLinks.map((link) => (
            <a
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <div className="w-full flex items-center justify-center gap-3 rounded-md bg-white text-black py-3 font-medium hover:opacity-90">
                {link.icon}
                <span className="capitalize">{link.name}</span>
              </div>
            </a>
          ))}
        </div>
      </div>

      <BottomNavBar />
    </div>
  );
}
