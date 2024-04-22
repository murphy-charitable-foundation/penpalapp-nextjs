import React from "react";
import Link from "next/link";
import Image from "next/image";

//Card for kid
export default function KidCard({ kid, calculateAge }) {
  return (
    <div
      key={kid.id}
      className="w-full max-w-sm my-4 p-4 rounded-lg shadow-lg flex flex-col items-start"
    >
<div className="w-48 h-48 overflow-hidden rounded-full mx-auto"> {/* Adjusted width and height */}
  <Image
    src={kid.image || "/usericon.png"}
    alt={kid.firstName}
    width={220} 
    height={220} 
    className="object-cover"
  />
</div>

      <h2 className="text-xl mt-3 mb-1 text-left text-bold" style={{ color: "#262626" }}>
        {kid.firstName}
      </h2>

      <p className="text-xs mb-1 text-left text-black">
        {calculateAge(kid.birthday)} years old
      </p>
      <p
        className="text-left mb-2 text-gray-900 text-xs break-words"
        style={{ color: "#515151" }}
      >
        {kid.bio}
      </p>
      <div className="flex justify-start flex-wrap gap-2 mb-4">
        {/* {kid.interests?.map((interest, idx) => (
          <span
            key={idx}
            className="px-3 py-1 text-xs rounded-full"
            style={{ backgroundColor: "#fea500", color: "white" }}
          >
            {interest}
          </span>
        ))} */}
        <p className="text-black break-words text-xs">{kid?.hobby}</p>
      </div>
      <div className="self-end mt-auto">
        <Link href="/letterwrite">
          <button
            className="w-28 py-2 rounded-3xl text-center text-xs"
            style={{ backgroundColor: "#0369a1", color: "white" }}
          >
            Send a message
          </button>
        </Link>
      </div>
    </div>
  );
}
