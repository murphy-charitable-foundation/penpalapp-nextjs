"use client";

import Image from "next/image";
import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";

import { PageBackground } from "../../components/general/PageBackground";
import { PageContainer } from "../../components/general/PageContainer";
import { PageHeader } from "../../components/general/PageHeader";

import BottomNavBar from "../../components/bottom-nav-bar";
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

const TOP_GAP = 6;
const GAP_BELOW = 2;

export default function Contact() {
  const [navH, setNavH] = useState(88);
  const navWrapRef = useRef(null);

  // EXACT letterhome navbar measurement
  useLayoutEffect(() => {
    const el = navWrapRef.current;
    if (!el) return;

    const update = () => setNavH(el.offsetHeight || 88);
    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);

    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);

    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
      ro.disconnect();
    };
  }, []);

  const socialLinks = [
    { name: "WhatsApp/phone", url: "tel:+256771983900", icon: <FaWhatsapp className="h-6 w-6" /> },
    { name: "Email", url: "mailto:murphycharity.info@gmail.com", icon: <FaEnvelope className="h-6 w-6" /> },
    { name: "Linkedin", url: "https://www.linkedin.com/company/murphy-charitable-foundation-uganda", icon: <FaLinkedinIn className="h-6 w-6" /> },
    { name: "Facebook", url: "https://www.facebook.com/murphycharityuganda/", icon: <FaFacebookF className="h-6 w-6" /> },
    { name: "Instagram", url: "https://www.instagram.com/murphycharity_/", icon: <FaInstagram className="h-6 w-6" /> },
    { name: "Website", url: "https://murphycharity.org", icon: <FaGlobe className="h-6 w-6" /> },
  ];

  return (
    <PageBackground className="bg-gray-100 min-h-[103dvh] overflow-hidden flex flex-col">
      <div className="flex-1 min-h-0" style={{ paddingTop: TOP_GAP }}>
        <div
          className="relative mx-auto w-full max-w-[29rem] rounded-2xl shadow-lg overflow-hidden flex flex-col min-h-0"
          style={{
            height: `calc(103dvh - ${navH}px - ${TOP_GAP}px - ${GAP_BELOW}px - env(safe-area-inset-bottom,0px))`,
          }}
        >

          <PageContainer
            width="compactXS"
            padding="none"
            scroll={false}
            bg="bg-white"
            viewportOffset={0}
            className="p-0 flex-1 min-h-0 flex flex-col overflow-hidden "
          >
            {/* Back Button */}
            <div
              className="absolute left-3 z-10"
              style={{ top: "calc(env(safe-area-inset-top, 0px) + 8px)" }}
            >
              <Link href="/cover">
                <BackButton size="xs" textColor="text-gray-700" />
              </Link>
            </div>

            {/* SINGLE SCROLLER */}
            <div
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-10"
              style={{
                WebkitOverflowScrolling: "touch",
                paddingBottom: `calc(${navH}px + ${GAP_BELOW}px + env(safe-area-inset-bottom,0px))`,
              }}
            >
              <div className="px-6">

                {/* Header */}
                <div className="pt-6">
                  <PageHeader title="Contact Us" image={false} />
                </div>

                {/* Avatar */}
                <div className="mt-4 flex justify-center">
                  <div
                    className="h-36 w-36 rounded-full bg-cover bg-center bg-no-repeat"
                    style={{ backgroundImage: 'url("/contact-asset-1.jpg")' }}
                  />
                </div>

                <p className="mt-4 text-center text-gray-600">Reach out to us here</p>

                {/* Social Links */}
                <div className="py-6 space-y-4">
                  {socialLinks.map((link) => {
                    const external = link.url.startsWith("http");
                    return (
                      <Link
                        key={link.name}
                        href={link.url}
                        target={external ? "_blank" : undefined}
                        rel={external ? "noopener noreferrer" : undefined}
                        className="flex items-center justify-center gap-3 rounded-full bg-secondary px-5 py-3.5 text-white shadow hover:opacity-90 transition"
                      >
                        {link.icon}
                        <span>{link.name}</span>
                      </Link>
                    );
                  })}
                </div>

                {/* Footer */}
                <div className="pb-4 flex items-center justify-center gap-1">
                  <Image src={logo} alt="Logo" width={20} height={20} />
                  <p className="text-xs text-gray-600">Murphy Charitable Foundation Uganda</p>
                </div>

              </div>
            </div>
          </PageContainer>
        </div>
      </div>

      {/* BOTTOM NAV */}
      <div ref={navWrapRef}>
        <BottomNavBar />
      </div>
    </PageBackground>
  );
}
