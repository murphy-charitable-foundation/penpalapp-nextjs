"use client";

import Image from "next/image";
import Link from "next/link";
import { PageBackground } from "../../components/general/PageBackground";
import { PageContainer } from "../../components/general/PageContainer";
import { PageHeader } from "@/components/general/PageHeader";
import NavBar from "../../components/bottom-nav-bar";
import { BackButton } from "../../components/general/BackButton";

import {
  FaWhatsapp,
  FaEnvelope,
  FaLinkedinIn,
  FaFacebookF,
  FaInstagram,
  FaGlobe,
} from "react-icons/fa";

import logo from "/public/murphylogo.png";

export default function Contact() {
  const socialLinks = [
    { name: "WhatsApp / Phone", url: "tel:+256771983900", icon: <FaWhatsapp /> },
    { name: "Email", url: "mailto:murphycharity.info@gmail.com", icon: <FaEnvelope /> },
    { name: "LinkedIn", url: "https://www.linkedin.com/company/murphy-charitable-foundation-uganda", icon: <FaLinkedinIn /> },
    { name: "Facebook", url: "https://www.facebook.com/murphycharityuganda/", icon: <FaFacebookF /> },
    { name: "Instagram", url: "https://www.instagram.com/murphycharity_/", icon: <FaInstagram /> },
    { name: "Website", url: "https://murphycharity.org", icon: <FaGlobe /> },
  ];

  return (
    <PageBackground className="bg-gray-100 h-screen flex flex-col">
      <div className="flex-1 min-h-0 flex justify-center">

        <PageContainer
          width="compactXS"
          padding="none"
          center={false}
          className="min-h-[100dvh] flex flex-col bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          {/* ===== HEADER ===== */}
          <PageHeader title="Contact Us" image={false} showBackButton />

          

          {/* ===== SCROLLABLE CONTENT (ONLY SCROLLER) ===== */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 pb-6 pt-4">
            <div className="mt-4 flex justify-center">
              <div
                className="h-36 w-36 rounded-full bg-cover bg-center"
                style={{ backgroundImage: 'url("/contact-asset-1.jpg")' }}
              />
            </div>

            <p className="mt-4 text-center text-gray-600">
              Reach out to us here
            </p>

            <div className="py-6 space-y-4">
              {socialLinks.map((link) => {
                const external = link.url.startsWith("http");
                return (
                  <Link
                    key={link.name}
                    href={link.url}
                    target={external ? "_blank" : undefined}
                    rel={external ? "noopener noreferrer" : undefined}
                    className="
                      flex
                      items-center
                      justify-center
                      gap-3
                      rounded-full
                      bg-secondary
                      px-5
                      py-3.5
                      text-white
                      shadow
                      hover:opacity-90
                      transition
                    "
                  >
                    {link.icon}
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </div>

            <div className="pt-4 flex justify-center items-center gap-2">
              <Image src={logo} alt="Logo" width={20} height={20} />
              <p className="text-xs text-gray-600">
                Murphy Charitable Foundation Uganda
              </p>
            </div>
          </div>

          {/* ===== NAVBAR ===== */}
          <div className="shrink-0 border-t bg-blue-100 rounded-b-2xl">
            <NavBar />
          </div>
        </PageContainer>
      </div>
    </PageBackground>
  );
}
