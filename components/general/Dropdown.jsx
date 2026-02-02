"use client";

import React, { useState, useRef, useEffect } from "react";

export default function Dropdown({
  options = [],
  currentValue = "",
  valueChange,
  placeholder = "Select",
  className = "",
  caretClass = "",
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  //safety guard
  const safeValue =
    typeof currentValue === "string" && currentValue.trim()
      ? currentValue
      : "";

  const displayText = safeValue || placeholder;

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`
          w-full h-11
          flex items-center justify-between
          bg-transparent
          border-b
          font-semibold
          transition-colors
          focus:outline-none
          ${safeValue ? "border-black" : "border-gray-300"}
        `}
      >


        <span
          className={`truncate ${
            safeValue ? "text-gray-900" : "text-gray-500"
          }`}
        >
          {displayText}
        </span>
        <span className={`text-gray-600 ${caretClass}`}>▾</span>
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-md">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                valueChange(opt);
                setOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
