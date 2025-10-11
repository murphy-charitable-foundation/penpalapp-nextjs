"use client";

import React from "react";
import Image from "next/image";
import SendMessage from "./SendMessage";

// brand palette (keep in sync across components)
const BRAND = {
  primary: "#034792",       // brand blue
  primarySoft: "#E6F0FF",   // very light blue wash
  chipBg: "#EEF4FF",        // chip background
  text: "#262626",          // headings
  subtext: "#515151",       // body copy
};

export default function KidCard({ kid, calculateAge }) {
  const imgSrc = kid?.photoURL || "/usericon.png";

  return (
    <div
      key={kid?.id}
      className="w-full max-w-sm my-3 p-4 rounded-2xl shadow-md flex flex-col items-start bg-white ring-1 ring-gray-100"
      style={{ flexGrow: 1 }}
    >
      <div className="w-40 h-40 overflow-hidden rounded-full mx-auto ring-2"
           style={{ borderColor: BRAND.primarySoft }}>
        <Image
          src={imgSrc}
          alt="Kid picture"
          width={220}
          height={220}
          className="object-cover w-full h-full"
          priority={false}
        />
      </div>

      <h2 className="text-xl mt-4 mb-1 font-semibold" style={{ color: BRAND.text }}>
        {kid?.first_name} {kid?.last_name}
      </h2>

      <p className="text-xs mb-1" style={{ color: BRAND.subtext }}>
        {calculateAge(kid?.date_of_birth)} years old
      </p>

      {kid?.bio && (
        <p className="text-left mb-3 text-xs leading-relaxed break-words"
           style={{ color: BRAND.subtext }}>
          {kid.bio}
        </p>
      )}

      {!!kid?.hobby?.length && (
        <div className="flex justify-start flex-wrap gap-2 mb-4">
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

      <div className="self-end mt-auto">
        <SendMessage kid={kid} />
      </div>
    </div>
  );
}
