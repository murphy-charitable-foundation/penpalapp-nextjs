"use client";

import Image from "next/image";
import Link from "next/link";
import logo from "/public/murphyLogo.png";

import Button from "../components/general/Button";
import { BackButton } from "../components/general/BackButton";

import { PageContainer } from "../components/general/PageContainer";

import { usePageAnalytics } from "../useAnalytics";
import { logButtonEvent, logLoadingTime } from "../utils/analytics";

import { useEffect } from "react";


export default function Home() {
  usePageAnalytics("/");

  return (
    <div className="relative min-h-screen bg-gray-100">
      {showSpinner && <LoadingSpinner />}

      <div className="fixed left-3 top-3 z-50 md:left-5 md:top-5">
        {/* <Link href="/cover" aria-label="Go back">
          <BackButton btnType="button" color="transparent" textColor="text-gray-700" size="xs" />
        </Link> */}
        <button onClick={() => handleNavigation('/cover')} aria-label="Go back">
          <BackButton btnType="button" color="transparent" textColor="text-gray-700" size="xs" />
        </button>
      </div>

      <PageContainer
        width="compactXS"
        padding="lg"
        bg="bg-gray-100"
        viewportOffset={0}
        scroll={false}                 
        className="rounded-3xl shadow-2xl ring-1 ring-gray-200 min-h-[100dvh] overflow-hidden"
      >
        
        <div className="relative min-h-[80vh]">
         
          <div className="absolute inset-x-0 top-6 sm:top-8 md:top-10 flex justify-center">
            <Image
              src={logo}
              alt="Murphy Charitable Foundation Uganda"
              width={160}
              height={160}
              className="h-auto w-36 sm:w-40 md:w-44"
              priority
            />
          </div>
          <div className="flex flex-col gap-10 jsu mb-36 items-center">
            <Link href="/login">
              <Button color={"green"} btnText={"Log in"} />
            </Link>
            <Link href="https://calendly.com/murphycharity/60min">
              <Button color={"blue"} btnText={"Become a Pen Pal Volunteer"} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}