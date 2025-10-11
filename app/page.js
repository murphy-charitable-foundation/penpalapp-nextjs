"use client";

import Image from "next/image";
import Link from "next/link";
import logo from "/public/murphylogo.png";
import { PageContainer } from "../components/general/PageContainer";
import { BackButton } from "../components/general/BackButton";
import Button from "../components/general/Button";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-gray-100">
      <div className="fixed left-3 top-3 z-50 md:left-5 md:top-5">
        <Link href="/cover" aria-label="Go back">
          <BackButton btnType="button" color="transparent" textColor="text-gray-700" size="xs" />
        </Link>
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

          <div className="absolute inset-x-0 bottom-10 sm:bottom-14 md:bottom-12 px-6"
    // style={{ paddingBottom: "calc(env(safe-area-inset-bottom,0px) + 6px)" }}
          >

            <div className="mx-auto w-full max-w-sm space-y-5 text-center">
              <Link href="/login" className="block">
                <Button
                  color="green"
                  btnText="Log in"
                  textColor="text-white"
                  className="w-full rounded-full py-3 px-6 text-base md:text-lg font-semibold shadow-sm
                             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
                             active:scale-[0.99] transition"
                />
              </Link>

              <Link href="https://calendly.com/murphycharity/60min" className="block">
                <Button
                  color="blue"
                  btnText="Become a Pen Pal Volunteer"
                  textColor="text-white"
                  className="w-full rounded-full py-3 px-6 text-base md:text-lg font-semibold shadow-sm
                             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
                             active:scale-[0.99] transition"
                />
              </Link>
            </div>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
