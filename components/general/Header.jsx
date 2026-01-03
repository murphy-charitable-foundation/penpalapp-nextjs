"use client";

import React from "react";
import { BackButton } from "./BackButton";

const DIVIDER = "#E5E7EB";


export default function Header({ activeFilter, setActiveFilter }) {
  return (
    <div className="sticky top-0 z-10 bg-white w-full max-w-full">
      
      {/* ===== TOP BAR ===== */}
      <div
        className="relative h-12 flex items-center justify-center border-b"
        style={{ borderColor: DIVIDER }}
      >
        {/* LEFT */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2">
          <BackButton size="xs" />
        </div>

        {/* TITLE */}
        <h1 className="text-lg font-bold text-[#034792]">
          Discover
        </h1>
      </div>

      {/* ===== FILTER TOGGLE ===== */}
      <button
        type="button"
        onClick={() => setActiveFilter(!activeFilter)}
        className="w-full h-12 px-4 flex items-center justify-between border-b bg-[#E6EDF4]"
        style={{ borderColor: DIVIDER }}
      >
        <span className="text-[15px] text-gray-700">
          Find and choose your next pen pal
        </span>

        <svg
          className="w-5 h-5 text-[#034792] transition-transform"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          {activeFilter ? (
            <path d="M14 13l-4-4-4 4" />
          ) : (
            <path d="M6 7l4 4 4-4" />
          )}
        </svg>
      </button>
    </div>
  );
}
