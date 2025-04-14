// page.js
"use client";
import Image from "next/image";
import logo from "/public/murphylogo.png";
import Link from "next/link";
import Button from "@/components/general/Button";
import { usePageAnalytics } from "@/app/utils/useAnalytics";
import { logButtonEvent, logLoadingTime } from "@/app/firebaseConfig";
import { useEffect } from "react";
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
        <div
          style={{
            textAlign: "left",
            padding: "20px",
            background: "white",
            height: "80%",
          }}
        >
          <Link href="/cover">
            <button
              style={{
                border: "none",
                background: "none",
              }}
            >
              <svg
                className="h-6 w-6 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
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
                onClick={() => logButtonEvent("log in clicked", "/")}
                color={"bg-green-700"}
                hoverColor={"hover:bg-green-800"}
                btnText={"Log in"}
              />
            </Link>
            <Link href="https://calendly.com/murphycharity/60min">
              <Button
                onClick={() =>
                  logButtonEvent("become a pen pal volunteer clicked", "/")
                }
                color={"bg-blue-700"}
                hoverColor={"hover:bg-blue-800"}
                btnText={"Become a Pen Pal Volunteer"}
              />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
