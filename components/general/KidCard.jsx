import React from "react";

//Card for kid
export default function KidCard({ kid }) {
  return (
    <div>
      <div
        key={kid.id}
        className="w-full max-w-sm my-4 p-4 rounded-lg shadow-lg flex flex-col items-start"
      >
        {" "}
        {/* Removed center alignment */}
        <div className="w-32 h-32 overflow-hidden rounded-full mx-auto">
          {" "}
          {/* Profile image container */}
          <Image
            src={kid.image || "/usericon.png"}
            alt={kid.firstName}
            width={128}
            height={128}
            className="object-cover"
          />
        </div>
        <h2
          className="text-xl mt-3 mb-1 text-left"
          style={{ color: "#262626" }}
        >
          {kid.firstName}
        </h2>{" "}
        {/* Text aligned left */}
        <p className="text-xs mb-1 text-left text-black">
          {calculateAge(kid.birthday)} years old
        </p>{" "}
        {/* Text aligned left */}
        <p
          className="text-left mb-2 text-gray-900 text-xs"
          style={{ color: "#515151" }}
        >
          {kid.bio}
        </p>{" "}
        {/* Text aligned left */}
        <div className="flex justify-start flex-wrap gap-2 mb-4">
          {" "}
          {/* Tags container */}
          {kid.interests?.map((interest, idx) => (
            <span
              key={idx}
              className="px-3 py-1 text-xs rounded-full"
              style={{ backgroundColor: "#fea500", color: "white" }}
            >
              {interest}
            </span>
          ))}
        </div>
        <div className="self-end mt-auto">
          {" "}
          {/* Button aligned to the right */}
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
    </div>
  );
}
