// pages/cover.js
"use client"
import Image from "next/image";
import logo from "/public/murphylogo.png";
import bgImage from "/public/cover.png";
import { usePageAnalytics } from "../useAnalytics";

export default function Cover() {
  usePageAnalytics("/cover");

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Image
        src={bgImage}
        alt="Murphy Charitable Foundation Uganda"
        layout="fill"
        objectFit="cover"
      />

      <div className="mb-6 mt-9 items-center flex justify-center">
        <div className="relative w-40 h-40 md:w-48 md:h-48">
          <Image
            src={logo}
            alt="Murphy Charitable Foundation Uganda"
            layout="fill"
            objectFit="contain"
          />
        </div>
      </div>
    </div>
  );
}