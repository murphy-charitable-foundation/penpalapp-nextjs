import React from "react";
import Image from "next/image";

export default function ProfileImage({ photo_uri, first_name, size = 8 }) {
  const sizeClass = `w-${size} h-${size}`;

  return (
    <div>
      <div
        className={`${sizeClass} bg-gray-200 rounded-full flex items-center justify-center overflow-hidden mr-2`}
      >
        {photo_uri && photo_uri.length != 0 ? (
          <Image
            src={photo_uri}
            className="w-full h-full object-cover"
            width="100"
            height="100"
            alt="profile picture"
          />
        ) : (
          <span className="text-xl text-gray-600">{first_name?.[0]}</span>
        )}
      </div>
    </div>
  );
}
