import React from "react";
import Image from "next/image";

export default function ProfileImage({ photo_uri, first_name, size = 12 }) {
    const pixelSize = size * 4;
  return (
    <div>
      <div className={`bg-gray-200 rounded-full flex items-center justify-center overflow-hidden mr-2`}
        style={{
          width: `${pixelSize}px`,
          height: `${pixelSize}px`,
        }}>
        {photo_uri && photo_uri.length != 0 ? (
          <Image
            src={photo_uri}
            alt="profile picture"
            width={pixelSize}
            height={pixelSize}
            className="object-cover rounded-full"
          />
        ) : (
          <span className="text-xl text-gray-600">{first_name?.[0]}</span>
        )}
      </div>
    </div>
  );
}
