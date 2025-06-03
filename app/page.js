"use client";
// page.js
"use client";
import Image from "next/image";
import logo from "/public/murphylogo.png";
import Link from "next/link";
import Button from "@/components/general/Button";
import { usePageAnalytics } from "@/app/useAnalytics";
import { logButtonEvent, logLoadingTime } from "@/app/utils/analytics";
import { useEffect } from "react";
import { BackButton } from "../components/general/BackButton";

export default function Home() {
  usePageAnalytics("/");

  useEffect(() => {
    const startTime = performance.now();

    requestAnimationFrame(() => {
      setTimeout(() => {
        const endTime = performance.now();
        const loadTime = endTime - startTime;
        console.log(`Page render time: ${loadTime}ms`);
        logLoadingTime("/", loadTime);
      }, 0);
    });
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-left p-4 bg-white h-[80%]">
          <Link href="/cover">
            <BackButton
              btnType="button"
              color="transparent"
              textColor="text-gray-600"
              onClick={() => router.push("/cover")}
              size="xs"
            />
          </Link>
          <div className="flex justify-center mb-40">
            <Image
              src={logo}
              alt="Murphy Charitable Foundation Uganda"
              width={150}
              height={150}
            />
          </div>
          <div className="flex flex-col gap-10 jsu mb-36 items-center">
            <Link href="/login">
              <Button
                color={"green"}
                btnText={"Log in"}
                onClick={() => logButtonEvent("log in clicked", "/")}
              />
            </Link>
            <Link href="https://calendly.com/murphycharity/60min">
              <Button
                color={"blue"}
                btnText={"Become a Pen Pal Volunteer"}
                onClick={() =>
                  logButtonEvent("become a pen pal volunteer clicked", "/")
                }
              />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
