"use client";

import React from "react";
import Image from "next/image";
import SendMessage from "./SendMessage";

const BRAND = {
  primary: "#034792",
  primarySoft: "#E6F0FF",
  chipBg: "#EEF4FF",
  text: "#262626",
  subtext: "#515151",
};

export default function KidCard({ kid, calculateAge }) {
  const imgSrc = kid?.photoURL || "/usericon.png";

  return (
    <div
      className="w-full mx-auto my-2 p-4 rounded-2xl shadow-md bg-white ring-1 ring-gray-100"
      style={{
        maxWidth: "22rem",   
      }}
    >
      <div
        className="w-32 h-32 mx-auto rounded-full overflow-hidden ring-2"
        style={{ borderColor: BRAND.primarySoft }}
      >
        <Image
          src={imgSrc}
          alt="Kid picture"
          width={128}
          height={128}
          className="object-cover w-full h-full"
        />
      </div>

      {/* Name*/}
      <h2
        className="text-lg mt-4 mb-1 font-semibold text-center"
        style={{ color: BRAND.text }}
      >
        {kid?.first_name} {kid?.last_name}
      </h2>

      {/* age*/}
      <p
        className="text-xs mb-2 text-center"
        style={{ color: BRAND.subtext }}
      >
        {calculateAge(kid?.date_of_birth)} years old
      </p>

      {/* bio */}
      {kid?.bio && (
        <p
          className="text-xs text-center mb-3 px-2 leading-relaxed"
          style={{ color: BRAND.subtext }}
        >
          {kid.bio}
        </p>
      )}

      {/* hobbies */}
      {!!kid?.hobby?.length && (
        <div className="flex justify-center flex-wrap gap-2 mb-4">
          {kid.hobby.map((hobby, idx) => (
            <span
              key={idx}
              className="px-3 py-1 text-[11px] rounded-full border"
              style={{
                backgroundColor: BRAND.chipBg,
                borderColor: BRAND.primarySoft,
                color: BRAND.text,
              }}
            >
              {hobby}
            </span>
          ))}
        </div>
      )}

      
      <div className="flex justify-center mt-2">
        <SendMessage kid={kid} />
      </div>
    </div>
  );
}
