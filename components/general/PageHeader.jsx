"use client";

import { useRouter } from "next/navigation";
import { BackButton } from "./BackButton";
import Image from "next/image";
import logo from "../../public/murphylogo.png";

export function PageHeader({
  title,
  titleColor = "text-secondary",
  image = false,
  heading = true,
}) {
  return (
    <>
      <div className="flex flex-row items-center justify-between mb-4">
        <BackButton />
        {heading ? (
          <h1
            className={`flex-grow text-center text-3xl font-bold ${titleColor}`}
          >
            {title}
          </h1>
        ) : (
          <span
            className={`flex-grow text-center font-medium ${titleColor} mt-1 mb-1`}
          >
            {title}
          </span>
        )}
      </div>
      {image && (
        <div className="flex justify-center">
          <Image src={logo} alt="Foundation Logo" width={200} margin={0} />
        </div>
      )}
    </>
  );
}
