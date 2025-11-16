"use client";

import Image from "next/image";
import Link from "next/link";
import logo from "/public/murphylogo.png";
import { PageContainer } from "../components/general/PageContainer";
import { BackButton } from "../components/general/BackButton";
import Button from "../components/general/Button";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import LoadingSpinner from "@/components/loading/LoadingSpinner";

export default function Home() {
  const [isPending, startTransition] = useTransition();
  const [showSpinner, setShowSpinner] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (isPending) {
      // Only show spinner if loading takes longer than 200ms
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
    <div className="relative min-h-screen bg-gray-100">
      {showSpinner && <LoadingSpinner />}

      <div className="fixed left-3 top-3 z-50 md:left-5 md:top-5">
        <BackButton btnType="button" color="transparent" textColor="text-gray-700" size="xs" />
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

          <div className="absolute inset-x-0 bottom-10 sm:bottom-14 md:bottom-12 px-6">

            <div className="mx-auto w-full max-w-sm space-y-5 text-center">
            
              <Button
                color="green"
                btnText="Log in"
                onClick={() => handleNavigation('/login')}
              />
              <Button
                color="blue"
                btnText="Become a Pen Pal Volunteer"
                href="https://calendly.com/murphycharity/60min"
                external={true}
              />
            </div>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
