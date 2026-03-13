"use client";

import Image from "next/image";
import { PageBackground } from "../components/general/PageBackground";
import { PageContainer } from "../components/general/PageContainer";
import Button from "../components/general/Button";
import logo from "../public/murphylogo.png";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import LoadingSpinner from "@/components/loading/LoadingSpinner";

export default function Home() {
  const [isPending, startTransition] = useTransition();
  const [showSpinner, setShowSpinner] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (isPending) {
      const timer = setTimeout(() => setShowSpinner(true), 200);
      return () => clearTimeout(timer);
    } else {
      setShowSpinner(false);
    }
  }, [isPending]);

  const handleNavigation = (href) => {
    startTransition(() => {
      router.push(href);
    });
  };

return (
  <PageBackground className="bg-gray-100 h-screen flex items-center justify-center overflow-hidden">
  {showSpinner && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
     <LoadingSpinner />
    </div>
  )}


  <PageContainer
    width="compactXS"
    padding="none"
    center={false}
    className="
      w-full
      max-w-[29rem]
      flex flex-col
      bg-white
      rounded-2xl
      shadow-lg
      overflow-hidden
      relative
      z-20
    "
  >
    {/* LOGO */}
    <div className="flex justify-center pt-10">
      <Image
        src={logo}
        alt="Murphy Charitable Foundation Uganda"
        width={150}
        height={150}
        className="h-auto w-36 sm:w-40 md:w-44"
      />
    </div>

    {/* TITLE */}
    <div className="px-10 pt-14 text-center">
      <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">
        Welcome to Pen Pal App
      </h1>
    </div>

    {/* SUBTITLE */}
    <div className="px-10 mt-3 text-center">
      <p className="text-gray-700 text-base md:text-lg leading-relaxed">
        Write, connect, and inspire children in Uganda
      </p>
    </div>

    {/* BUTTONS */}
    <div className="text-center w-full pt-20 pb-10 px-10">
      <div className="mx-auto max-w-sm space-y-5">

        {/*TODO: Button is inactive on first app load but works after a page refresh.
        Likely related to initial state hydration or lifecycle timing.*/}
        <Button
          btnText="Log in"
          color="green"
          onClick={() => handleNavigation("/login")}
        />

        <Button
          btnText="Become a Pen Pal Volunteer"
          color="blue"
          href="https://calendly.com/murphycharity/60min"
          external
        />
      </div>
    </div>
  </PageContainer>
</PageBackground>
);

}
