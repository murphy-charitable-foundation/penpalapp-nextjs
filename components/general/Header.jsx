"use client";

import Link from "next/link";
import Button from "./Button";
import Image from "next/image";
import logo from "/public/murphylogo.png";
export default function Header({ activeFilter, setActiveFilter, title, status="sent"}) {
  return (
    <div className={`${status=="sent" 
      ? "bg-green-700" 
      : status=="pending_review" 
      ? "bg-blue-700" 
      : "bg-red-700"} 
    text-white p-4 flex items-center gap-4 rounded-md`}>
      <Image
        src={logo}
        alt="Murphy Charitable Foundation Uganda"
        width={150}
        height={150}
        className="h-10 w-10 rounded-full"
      />
      <h1 className="text-2xl font-semibold">Admin user</h1>
      <div className="ml-auto">
        <FilterButton activeFilter={activeFilter} setActiveFilter={setActiveFilter} />
      </div>
    </div>
  );
}

function FilterButton({ activeFilter, setActiveFilter }) {
  return (
    <div>
      <Button
        btnText={`${!activeFilter ? "Filters" : "Back"}`}
        color="white"
        size="xs"
        onClick={() => {
          setActiveFilter(!activeFilter);
        }}
      >
        <span className="flex items-center">
          <p>Filters</p>
          {!activeFilter ? (
            <svg className="w-6 h-7 ml-2 fill-current" viewBox="0 0 20 20">
              <path d="M5.95 6.95l4 4 4-4 .707.708L10 12.364 5.242 7.657l.707-.707z" />
            </svg>
          ) : (
            <svg className="w-6 h-7 ml-2 fill-current" viewBox="0 0 20 20">
              <path d="M14.05 13.05l-4-4-4 4-.707-.708L10 7.636l4.758 4.707-.707.707z" />
            </svg>
          )}
        </span>
      </Button>
    </div>
  );
}
