"use client";

import Image from "next/image";
import { BackButton } from "./BackButton";
import logo from "../../public/murphylogo.png";

export function PageHeader({
  title,
  titleColor = "text-secondary",
  image = true,
  heading = true,
  showBackButton = true,
  imageSize = "md", 
}) {
  const imageWidth =
    imageSize === "sm"
      ? 96
      : imageSize === "lg"
      ? 200
      : 160; // default (md)

  return (
    <>
      {/* HEADER ROW */}
      <div className="flex items-center mb-4 px-4">
        {/* LEFT */}
        <div className="w-8 flex justify-start">
          {showBackButton && <BackButton size="xs" />}
        </div>

        {/* CENTER */}
        {heading ? (
          <h1
            className={`
              flex-1
              text-center
              text-2xl
              font-bold
              tracking-tight
              ${titleColor}
            `}
          >
            {title}
          </h1>
        ) : (
          <span
            className={`
              flex-1
              text-center
              font-medium
              ${titleColor}
            `}
          >
            {title}
          </span>
        )}

        {/* RIGHT SPACER */}
        <div className="w-8" />
      </div>

      {/* LOGO */}
      {image && (
        <div className="flex justify-center mb-4">
          <Image
            src={logo}
            alt="Foundation Logo"
            width={imageWidth}
            priority
          />
        </div>
      )}
    </>
  );
}
