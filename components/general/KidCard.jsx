import React from "react";
import Image from "next/image";
import SendMessage from "../discovery/SendMessage";

//Card for kid
export default function KidCard({ kid, calculateAge }) {
  console.log(kid)
  return (
    <div
      key={kid?.id}
      className="w-full max-w-sm my-4 p-4 rounded-lg shadow-md flex flex-col items-start"
      style={{ flexGrow: 1 }}
    >
      <div className="w-48 h-48 overflow-hidden rounded-full mx-auto">
        <Image
          src={kid?.photoURL || "/usericon.png"}
          alt="Kid picture"
          width={220}
          height={220}
          className="object-cover"
        />
      </div>

      <h2
        className="text-xl mt-3 mb-1 text-left text-bold"
        style={{ color: "#262626" }}
      >
        {kid?.first_name} {kid?.last_name}
      </h2>

      <p className="text-xs mb-1 text-left text-black">
        {calculateAge(kid?.date_of_birth)} years old
      </p>
      <p
        className="text-left mb-2 text-gray-900 text-xs break-words"
        style={{ color: "#515151" }}
      >
        {kid?.bio}
      </p>
      <div className="flex justify-start flex-wrap gap-2 mb-4">
        {kid.hobby?.map((hobby, idx) => (
          <span
            key={idx}
            className="px-3 py-1 text-xs rounded-full"
            style={{ backgroundColor: "#f8fcec", color: "black" }}
          >
            {hobby}
          </span>
        ))}
      </div>
      <div className="self-end mt-auto">
        <SendMessage kid={kid}/>
      </div>
    </div>
  );
}
