"use client";

import Link from "next/link";
import Button from "./Button";

export default function Header({ activeFilter, setActiveFilter, title }) {
  
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:bg-[#356CA8] sticky top-0 z-10">
      <div className="p-4 flex items-center justify-between text-black sm:text-white bg-white sm:bg-[#034078]">
        <div className="flex gap-4 justify-center w-full">
          <h1 className="text-xl sm:text-2xl font-bold text-center">
            {title}
          </h1>
        </div>
      </div>

      <FilterButton activeFilter={activeFilter} setActiveFilter={setActiveFilter} />
    </div>
  );
}

function FilterButton({ activeFilter, setActiveFilter }) {
  return (
    <div className="p-4 bg-[#356CA8] sm:bg-[#034078]">
      <Button
        btnText="Filters"
        color="bg-transparent"
        size="small"
        onClick={() => {
          setActiveFilter(!activeFilter);}}
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
