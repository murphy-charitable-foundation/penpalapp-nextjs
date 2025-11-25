"use client";

import { useState, useEffect, useRef, useLayoutEffect } from "react";

import Link from "next/link";
import Image from "next/image";
import BottomNavBar from "../../components/bottom-nav-bar";
import Button from "../../components/general/Button";
import { PageBackground } from "../../components/general/PageBackground";
import PageContainer from "../../components/general/PageContainer";
import { PageHeader } from "../../components/general/PageHeader";
import { useUser } from "@/contexts/UserContext";

const TOP_GAP = 8;
const GAP_BELOW = 2;

export default function Welcome() {
  const { user } = useUser();
  const [navH, setNavH] = useState(88);
  const [firstName, setFirstName] = useState("");
  usePageAnalytics("/welcome");

  const navWrapRef = useRef(null);
  const navbarHeight = user ? navH : 0;
  const whiteCardWrapperHeight = {
    height: user ? `calc(103dvh - ${navH}px - ${TOP_GAP}px - ${GAP_BELOW}px - env(safe-area-inset-bottom,0px))` : 'auto',
  }

  useEffect(() => {
    const value = localStorage.getItem("userFirstName");

    if (value) {
      setFirstName(value);
    }
  }, []);

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
  
  return (
    <PageBackground className="bg-gray-100 h-screen overflow-hidden flex flex-col">
      <div className="flex-1 overflow-hidden">
        <div
            className="mx-auto w-full max-w-[640px] shadow-lg"
            style={whiteCardWrapperHeight}
          >
            <div className="h-full rounded-2xl overflow-hidden bg-white">
              <PageContainer
                width="compactXS"
                padding="none"
                bg="bg-white"
                center
                scroll
                viewportOffset={navbarHeight}
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
                  <Button 
                    btnText="Continue" 
                    color="blue"
                    onClick={ () => (
                      startTransition(() => {
                        router.push('/edit-profile-user-image');
                      })
                    )}
                  />
                </div>
                
              </PageContainer>
            </div>
        </div>
      </div>
      {/* Bottom Nav */}
      <div ref={navWrapRef}>
        <BottomNavBar />
      </div>
    </PageBackground>

  );
}