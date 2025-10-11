"use client";

import Button from "./Button";

const LIGHT_BLUE = "#E6EDF4";
const DIVIDER = "#D9E5F0";
const BRAND_BLUE = "#034792";

export default function Header({ activeFilter, setActiveFilter }) {
  return (
    <div className="sticky top-0 z-10">
      {/* Top: title bar (light blue, flush to top) */}
      <div
        className="w-full flex items-center justify-center"
      >
        <h1 className="text-center font-semibold text-black py-3 text-lg sm:text-xl">
          Choose a kid to write to
        </h1>
      </div>

      {/* Bottom: Filters bar */}
      <div
        className="w-full flex items-center justify-end px-4 py-2"
        style={{ backgroundColor: LIGHT_BLUE, borderTop: `1px solid ${DIVIDER}` }}
      >
        <Button
          color="bg-transparent"
          size="small"
          onClick={() => setActiveFilter(!activeFilter)}
          aria-label="Toggle filters"
        >
          <span className="flex items-center">
            {/* ⚡ Flash icon */}
            <svg
              className="w-4 h-4 mr-2"
              viewBox="0 0 24 24"
              fill="black"
              aria-hidden="true"
            >
              <path d="M13 2L3 14h7l-1 8 11-14h-7l1-6z" />
            </svg>

            <span>Filters</span>

            {/* caret */}
            {!activeFilter ? (
              <svg className="w-5 h-5 ml-2 fill-current" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M5.95 6.95l4 4 4-4 .707.708L10 12.364 5.242 7.657l.707-.707z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 ml-2 fill-current" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M14.05 13.05l-4-4-4 4-.707-.708L10 7.636l4.758 4.707-.707.707z" />
              </svg>
            )}
          </span>
        </Button>
      </div>
    </div>
  );
}
