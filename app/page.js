"use client";

import Image from "next/image";
import { PageBackground } from "../components/general/PageBackground";
import { PageContainer } from "../components/general/PageContainer";
import Button from "../components/general/Button";
import logo from "../public/murphylogo.png";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const handleNavigation = (href) => {
    window.dispatchEvent(new Event("app:navigation-start"));
    router.push(href);
  };

  return (
    <PageBackground className="bg-gray-100 h-screen flex items-center justify-center overflow-hidden">
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
        {/* Logo */}
        <div className="flex justify-center pt-10">
          <Image
            src={logo}
            alt="Murphy Charitable Foundation Uganda"
            width={150}
            height={150}
            className="h-auto w-36 sm:w-40 md:w-44"
          />
        </div>

        {/* Title */}
        <div className="px-10 pt-14 text-center">
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">
            Welcome to Pen Pal App
          </h1>
        </div>

        {/* Subtitle */}
        <div className="px-10 mt-3 text-center">
          <p className="text-gray-700 text-base md:text-lg leading-relaxed">
            Write, connect, and inspire children in Uganda
          </p>
        </div>

        {/* Buttons */}
        <div className="text-center w-full pt-20 pb-10 px-10">
          <div className="mx-auto max-w-sm space-y-5">
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