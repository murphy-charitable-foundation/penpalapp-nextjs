"use client";

import Image from "next/image";
import Button from "./Button";
import logo from "/public/murphylogo.png";

export default function Header({
  activeFilter,
  setActiveFilter,
  title,
  status = "sent",
}) {
  return (
    <div
      className={`${
        status === "sent"
          ? "bg-green-700"
          : status === "pending_review"
          ? "bg-blue-700"
          : "bg-red-700"
      } text-white p-4 flex items-center gap-4 rounded-md`}
    >
      <Image
        src={logo}
        alt="Murphy Charitable Foundation Uganda"
        width={150}
        height={150}
        className="h-10 w-10 rounded-full"
      />

      <h1 className="text-2xl font-semibold">Admin user</h1>

      <div className="ml-auto">
        <FilterButton
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
        />
      </div>
    </div>
  );
}

function FilterButton({ activeFilter, setActiveFilter }) {
  return (
    <Button
      color="white"
      size="xs"
      onClick={() => setActiveFilter(!activeFilter)}
    >
      <span className="flex items-center gap-2">
        <span>{activeFilter ? "Back" : "Filters"}</span>

        {activeFilter ? (
          <svg
            className="w-4 h-4 fill-current"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path d="M14.05 13.05 10 9l-4.05 4.05.7.7L10 10.4l3.35 3.35z" />
          </svg>
        ) : (
          <svg
            className="w-4 h-4 fill-current"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path d="M5.95 6.95 10 11l4.05-4.05-.7-.7L10 9.6 6.65 6.25z" />
          </svg>
        )}
      </span>
    </Button>
  );
}
