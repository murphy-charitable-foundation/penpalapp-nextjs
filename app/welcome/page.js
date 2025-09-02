"use client";

import { useState, useEffect } from "react";

import Image from "next/image";
import Link from "next/link";
import Button from "../../components/general/Button";
import { usePageAnalytics } from "../useAnalytics";
import { logButtonEvent, logLoadingTime } from "../utils/analytics";

export default function Welcome() {
  const [firstName, setFirstName] = useState("");
  usePageAnalytics("/welcome");

  useEffect(() => {
    const value = localStorage.getItem("userFirstName");
    const startTime = performance.now();

    if (value) {
      setFirstName(value);
    }
    requestAnimationFrame(() => {
      setTimeout(() => {
        const endTime = performance.now();
        const loadTime = endTime - startTime;
        console.log(`Page render time: ${loadTime}ms`);
        logLoadingTime("/welcome", loadTime);
      });
    });
  }, []);
  return (
    <div className="min-h-screen !bg-primary">
      <div className="max-w-lg mx-auto text-white flex flex-col min-h-screen">
        <div className="relative w-full h-[50vh] bg-[url('/welcome.png')] bg-cover bg-center"></div>
        <h3 className="pt-16 text-center w-full font-[700] text-2xl">
          Welcome, {firstName}
        </h3>
        <div className="text-center w-full pt-5 flex-1">
          We are so happy to be here, thanks for your support. Now you are part
          of the family.
        </div>
        <div className="text-center w-full pt-10 pb-20">
          <Link href="/edit-profile-user-image">
            <Button
              btnText="Continue"
              color="white"
              onClick={() => {
                logButtonEvent("/welcome", "Continue button clicked!");
              }}
            />
          </Link>
        </div>
      </div>
    </div>
  );
}