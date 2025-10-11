"use client";

import { useState, useRef, useLayoutEffect } from "react";
import Image from "next/image";
import Link from "next/link";

import {
  FaInstagram,
  FaLinkedinIn,
  FaEnvelope,
  FaGlobe,
  FaFacebookF,
  FaWhatsapp,
} from "react-icons/fa";

import BottomNavBar from "../../components/bottom-nav-bar";
import { BackButton } from "../../components/general/BackButton";
import { PageContainer } from "../../components/general/PageContainer";
import { PageHeader } from "../../components/general/PageHeader";
import logo from "/public/murphylogo.png";

// small top gap to match other pages
const TOP_GAP = 1;

export default function Contact() {
  const [navH, setNavH] = useState(88);
  const navWrapRef = useRef(null);

  useLayoutEffect(() => {
    const el = navWrapRef.current;
    if (!el) return;
    const update = () => setNavH(el.offsetHeight || 88);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("resize", update);
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
    <div
      className="bg-gray-100 h-screen overflow-hidden flex flex-col"
      style={{ "--navH": `${navH}px` }}
    >
      {/* keep page chrome fixed; only the card will scroll */}
      <div className="flex-1 overflow-hidden min-h-0" style={{ paddingTop: TOP_GAP }}>
        {/* height stops ~2px above the BottomNav so the rounded corner shows */}
        <div
          className="mx-auto w-full max-w-none sm:max-w-[29rem] overflow-hidden rounded-2xl min-h-0"
          style={{
            height: `calc(102svh - var(--navH) - ${TOP_GAP}px + 2px)`, // tiny external gap
            marginBottom: "0px",
            boxShadow: "0 8px 12px -6px rgba(0,0,0,0.08)",
          }}
        >
          {/* make the white card scroll, not the whole page */}
          <PageContainer
            width="compactXS"
            padding="none"
            bg="bg-white"
            scroll={true}                 
            viewportOffset={navH}
            className="p-0 h-full min-h-0 overflow-y-auto"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            <div className="px-6">
              {/* Back */}
              <div
                className="absolute left-3 z-10"
                style={{ top: "calc(env(safe-area-inset-top, 0px) + 8px)" }}
              >
                <Link href="/cover" aria-label="Go back">
                  <BackButton
                    btnType="button"
                    color="transparent"
                    textColor="text-gray-700"
                    size="xs"
                  />
                </Link>
              </div>

              {/* Header */}
              <div className="pt-2">
                <PageHeader title="Contact Us" image={false} />
              </div>

              {/* Avatar + Intro */}
              <div className="mt-4">
                <div className="flex justify-center">
                  <div
                    className="h-36 w-36 rounded-full bg-cover bg-center bg-no-repeat"
                    style={{ backgroundImage: 'url("/contact-asset-1.jpg")' }}
                  />
                </div>
                <p className="mt-4 text-center text-gray-600">Reach out to us here</p>
              </div>

              {/* Social links */}
              <div className="py-4">
                <div className="space-y-4 md:space-y-5">
                  {socialLinks.map((link) => {
                    const isHttp = link.url.startsWith("http");
                    return (
                      <Link
                        key={link.name}
                        href={link.url}
                        target={isHttp ? "_blank" : undefined}
                        rel={isHttp ? "noopener noreferrer" : undefined}
                        className="flex items-center justify-center gap-3 rounded-full bg-secondary px-5 py-3.5 text-white shadow hover:opacity-90 transition"
                      >
                        {link.icon}
                        <span>{link.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Footer (inside the scrollable card) */}
              <div className="pb-3">
                <div className="flex items-center justify-center gap-1">
                  <Image src={logo} alt="Foundation Logo" width={20} height={20} />
                  <p className="text-xs text-gray-600">Murphy Charitable Foundation Uganda</p>
                </div>
              </div>

              {/* spacer ensures you can scroll the footer fully ABOVE the tiny gap */}
              <div
                aria-hidden="true"
                style={{ height: `calc(var(--navH) + 8px)` }}
              />
            </div>
          </PageContainer>
        </div>
      </div>

      {/* Bottom Nav (height observed above) */}
      <div ref={navWrapRef}>
        <BottomNavBar />
      </div>
    </div>
  );
}
