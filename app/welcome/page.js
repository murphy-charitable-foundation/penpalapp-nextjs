"use client";

import { useState, useEffect } from "react";

import Link from "next/link";
import Image from "next/image";
import BottomNavBar from "../../components/bottom-nav-bar";
import Button from "../../components/general/Button";
import { PageBackground } from "../../components/general/PageBackground";
import PageContainer from "../../components/general/PageContainer";
import { PageHeader } from "../../components/general/PageHeader";

const NAV_H = 88;

export default function Welcome() {
  const [firstName, setFirstName] = useState("");

  useEffect(() => {
    const value = localStorage.getItem("userFirstName");
    if (value) {
      setFirstName(value);
    }
  }, []);
  return (
    <PageBackground className="bg-gray-100 h-screen overflow-hidden flex flex-col">
      <div className="flex-1 overflow-hidden">
        <div
            className="mx-auto w-full max-w-[640px] shadow-lg"
            style={{
              height: `calc(103svh - ${NAV_H}px )`,
            }}
          >
            <div className="h-full rounded-2xl overflow-hidden bg-white">
              <PageContainer
                width="compactXS"
                padding="none"
                bg="bg-white"
                center
                scroll
                viewportOffset={NAV_H}
                className="p-0 h-full min-h-0 overflow-y-auto overscroll-contain"
                style={{
                  WebkitOverflowScrolling: "touch",
                }}
              >
                {/* Header */}
                <div className="px-10 pt-2">
                  <PageHeader title="Welcome" image={false} />
                </div>

                <div className="px-10 pb-2">
                  <Image
                    src="/welcome.png"
                    alt="Picture of kids"
                    // fill
                    className="object-cover rounded-xl w-full"
                    width={100}
                    height={100}
                    sizes="100vw"
                  />

                  <p className="pt-10 leading-relaxed text-gray-700">
                  We are so happy to be here, thanks for your support. Now you are part of the family.
                  </p>
                </div>

                <div className="text-center w-full pt-10 pb-20">
                  <Link href="/edit-profile-user-image">
                    <Button btnText="Continue" color="blue" />
                  </Link>
                </div>
              </PageContainer>
            </div>
        </div>
      </div>
      <BottomNavBar />
    </PageBackground>
    // <div className="min-h-screen !bg-secondary">
    //   <div className="max-w-lg mx-auto text-white flex flex-col min-h-screen">
    //     <div className="relative w-full h-[50vh] bg-[url('/welcome.png')] bg-cover bg-center"></div>
    //     <h3 className="pt-16 text-center w-full font-[700] text-2xl">
    //       Welcome, {firstName}
    //     </h3>
    //     <div className="text-center w-full pt-5 flex-1">
    //       We are so happy to be here, thanks for your support. Now you are part
    //       of the family.
    //     </div>
    //     <div className="text-center w-full pt-10 pb-20">
    //       <Link href="/edit-profile-user-image">
    //         <Button btnText="Continue" color="white" />
    //       </Link>
    //     </div>
    //   </div>
    // </div>
  );
}