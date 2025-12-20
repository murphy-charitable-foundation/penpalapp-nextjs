"use client";
import KidFilter from "../discovery/KidFilter";
import React from "react";

export default function FilterPanel({
  open,
  initial,   // { age, gender, hobbies }
  onApply,
  onClear,
  onClose,
}) {
  const handleApply = (ageVal, hobbyArr, genderVal) => {
    onApply?.({
      age: Number(ageVal) || 0,
      gender: genderVal || "",
      hobbies: Array.isArray(hobbyArr) ? hobbyArr : [],
    });
  };

  const proxyClear = () => { onClear?.(); };

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-[98] bg-black/35 backdrop-blur-[2px]"
          onClick={onClose}
        />
      )}

      <div
        className={`fixed inset-x-0 top-[6dvh] mx-auto z-[99] w-full max-w-[640px] 
                    transition-transform duration-300
                    ${open ? "translate-y-0" : "-translate-y-[120%]"}`}
      >
        <div className="mx-4 sm:mx-0 rounded-2xl shadow-xl ring-1 ring-black/10 bg-white overflow-hidden">
          {/* Header */}
          <div className="relative h-12 flex items-center justify-center border-b border-gray-200">
            <button
              onClick={onClose}
              className="absolute left-3 p-2 rounded-full hover:bg-gray-100"
              aria-label="Close"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M6 6l12 12M18 6L6 18" stroke="#111827" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
            <h2 className="font-semibold text-[#034792]">Filters</h2>
            <div className="absolute right-3 w-8 h-8" />
          </div>

          <div className="max-h-[75dvh] overflow-y-auto overscroll-contain"
               style={{ WebkitOverflowScrolling: "touch" }}>
            <KidFilter
              hobbies={initial?.hobbies || []}
              age={initial?.age || 0}
              gender={initial?.gender || ""}
              filter={handleApply}
              setHobbies={proxyClear}
              setAge={proxyClear}
              setGender={proxyClear}
            />
          </div>
        </div>
      </div>
    </>
  );
}
