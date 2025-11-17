"use client";

import Image from "next/image";
import Link from "next/link";
import logo from "/public/murphylogo.png";
import { PageContainer } from "../components/general/PageContainer";
import { BackButton } from "../components/general/BackButton";
import Button from "../components/general/Button";
import { usePageAnalytics } from "./useAnalytics";
import { logButtonEvent, logLoadingTime } from "./utils/analytics";
import { useEffect } from "react";

export default function Home() {
  usePageAnalytics("/");

  return (
    <div className="relative min-h-screen bg-gray-100">
      <PageContainer
        width="compactXS"
        padding="lg"
        bg="bg-gray-100"
        viewportOffset={0}
        scroll={false}
        className="rounded-3xl shadow-2xl ring-1 ring-gray-200 min-h-[100dvh] overflow-hidden"
      >
        <div className="relative min-h-[90vh]">
          {/* Logo */}
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

          {/* Added text  */}
          <div className="absolute inset-x-0 top-[220px] sm:top-[240px] md:top-[260px] px-6 py-6 text-center">
            <h1 className="text-xl md:text-2xl font-semibold text-gray-900">
              Welcome to Pen Pal App
            </h1>
            <p className="mt-2 mb-8 text-gray-800 text-sm md:text-base font-semibold">
              Write, connect, and inspire children in Uganda
            </p>
          </div>

          {/* Buttons */}
          <div className="absolute inset-x-0 bottom-10 sm:bottom-14 md:bottom-12 px-6">
            <div className="mx-auto w-full max-w-sm space-y-5 text-center">
              <Link href="/login" className="block">
                <Button
                  color="green"
                  btnText="Log in"
                  textColor="text-white"
                  className="w-full rounded-full py-3 px-6 text-base md:text-lg font-semibold shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.99] transition"
                />
              </Link>

              <Link href="https://calendly.com/murphycharity/60min" className="block">
                <Button
                  color="blue"
                  btnText="Become a Pen Pal Volunteer"
                  textColor="text-white"
                  className="w-full rounded-full py-3 px-6 text-base md:text-lg font-semibold shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.99] transition"
                />
              </Link>
            </div>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}