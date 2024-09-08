import React from "react";
import Image from "next/image";

export default function ProfileImage({ photo_uri, first_name }) {
  return (
    <div>
      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden mr-2">
        {photo_uri && photo_uri.length != 0 ? (
          <img
            src={photo_uri}
            class="w-full h-full object-cover"
            alt="profile picture"
            // width={24}
            // height={24}
            // layout="responsive"
          />
        ) : (
          <span className="text-xl text-gray-600">{first_name?.[0]}</span>
        )}
      </div>
    </div>
  );
}
