"use client";

import React from "react";
import Button from "./Button";

const DIVIDER = "#E5E7EB";     
const ICON = "#111827";       

export default function Header({ activeFilter, setActiveFilter }) {
  return (
    <div className="sticky top-0 z-10 bg-white">
      
      <div className="relative h-12 flex items-center justify-center border-b" style={{ borderColor: DIVIDER }}>
       
        <button
          type="button"
          onClick={() => window.history.back()}
          aria-label="Back"
          className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-gray-100 active:scale-95"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke={ICON} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <h1 className="text-[30px] sm:text-base font-bold text-[#034792]">
          Discover
        </h1>

        <div className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8" />
      </div>

      
      <button
        type="button"
        onClick={() => setActiveFilter(!activeFilter)}
        aria-label="Toggle filters"
        className="w-full h-12 px-4 flex items-center justify-between border-b bg-[#E6EDF4]"
        style={{ borderColor: DIVIDER, WebkitTapHighlightColor: 'transparent' }}
      >
        <span className="text-[15px] text-gray-700">Find and choose your next pen pal</span>
        <svg className="w-5 h-5 text-[#034792]" viewBox="0 0 20 20" fill="currentColor">
          {activeFilter ? (
           <path d="M14.05 13.05l-4-4-4 4-.707-.708L10 7.636l4.758 4.707-.707.707z" />
           ) : (
           <path d="M5.95 6.95l4 4 4-4 .707.708L10 12.364 5.242 7.657l.707-.707z" />
          )}
        </svg>
      </button>

    </div>
  );
}
