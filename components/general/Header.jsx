"use client";

import React from "react";

const DIVIDER = "#E5E7EB";
const ICON = "#111827";

export default function Header({ activeFilter, setActiveFilter }) {
  return (
    <div className="sticky top-0 z-10 bg-white w-full max-w-full">
      
      <div
        className="relative h-12 flex items-center justify-center border-b w-full max-w-full"
        style={{ borderColor: DIVIDER }}
      >
        <button
          type="button"
          onClick={() => setSelectedLetter(null)}
          aria-label="Back"
          className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-gray-100"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke={ICON} strokeWidth="2" />
          </svg>
        </button>

        <h1 className="text-lg font-bold text-[#034792]">Discover</h1>
      </div>

      <button
        type="button"
        onClick={() => setActiveFilter(!activeFilter)}
        className="w-full max-w-full h-12 px-4 flex items-center justify-between border-b bg-[#E6EDF4]"
        style={{ borderColor: DIVIDER }}
      >
        <span className="text-[15px] text-gray-700">
          Find and choose your next pen pal
        </span>

        <svg className="w-5 h-5 text-[#034792]" viewBox="0 0 20 20" fill="currentColor">
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
