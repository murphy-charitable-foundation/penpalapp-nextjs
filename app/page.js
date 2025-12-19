"use client";

import Image from "next/image";
import Link from "next/link";
import { PageBackground } from "../components/general/PageBackground";
import { PageContainer } from "../components/general/PageContainer";
import Button from "../components/general/Button";
import logo from "/public/murphylogo.png";

const TOP_GAP = 6;
const GAP_BELOW = 2;

export default function Cover() {
  return (
    <PageBackground className="bg-gray-100 min-h-[100dvh] overflow-hidden flex flex-col">
      <div className="flex-1 min-h-0" style={{ paddingTop: TOP_GAP }}>
        
        <div
          className="relative mx-auto w-full max-w-[29rem] rounded-2xl shadow-lg overflow-hidden flex flex-col min-h-0"
          style={{
            height: `calc(100dvh - ${TOP_GAP}px - ${GAP_BELOW}px - env(safe-area-inset-bottom,0px))`,
          }}
        >
          
          <PageContainer
            width="compactXS"
            padding="none"
            bg="bg-white"
            scroll={false}
            viewportOffset={0}
            className="p-0 flex-1 min-h-0 flex flex-col overflow-hidden"
          >
            
            <div className="flex flex-col h-full min-h-0 items-center px-6 pt-10 pb-12">
              
              {/* LOGO */}
              <div className="mb-10">
                <Image
                  src={logo}
                  alt="Murphy Charitable Foundation Uganda"
                  width={160}
                  height={160}
                  className="h-auto w-36 sm:w-40 md:w-44"
                  priority
                />
              </div>

              {/* TITLE + SUBTITLE */}
              <div className="text-center mb-12">
                <h1 className="text-xl md:text-2xl font-semibold text-gray-900">
                  Welcome to Pen Pal App
                </h1>
                <p className="mt-4 text-gray-800 text-sm md:text-base font-semibold">
                  Write, connect, and inspire children in Uganda
                </p>
              </div>

              {/* BUTTONS */}
              <div className="w-full mt-auto">
                <div className="mx-auto w-full max-w-sm space-y-5 text-center">
                  
                  <Link href="/login" className="block">
                    <Button
                      color="green"
                      btnText="Log in"
                      textColor="text-white"
                      className="w-full rounded-full py-3 text-base md:text-lg font-semibold shadow-sm"
                    />
                  </Link>

                  <Link
                    href="https://calendly.com/murphycharity/60min"
                    className="block"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button
                      color="blue"
                      btnText="Become a Pen Pal Volunteer"
                      textColor="text-white"
                      className="w-full rounded-full py-3 text-base md:text-lg font-semibold shadow-sm"
                    />
                  </Link>
                </div>
              </div>
            </div>

          </PageContainer>
        </div>
      </div>
    </PageBackground>
  );
}

