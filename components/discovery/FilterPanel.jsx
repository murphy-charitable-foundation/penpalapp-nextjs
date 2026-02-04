"use client";
import React, { useState, useEffect } from "react";
import KidFilter from "../discovery/KidFilter";

export default function FilterPanel({
  open,
  initial, // { age, gender, hobbies }
  onApply,
  onClose,
}) {
  const [hobbies, setHobbies] = useState([]);
  const [age, setAge] = useState(null);
  const [gender, setGender] = useState("");

  useEffect(() => {
    setHobbies(initial?.hobbies || []);
    setAge(initial?.age ?? null);
    setGender(initial?.gender || "");
  }, [initial, open]);

  const handleApplyFromKidFilter = (payload) => {
    onApply?.({
      age: payload?.age ?? null,
      gender: payload?.gender ?? "",
      hobbies: payload?.hobbies ?? [],
    });
    onClose?.();
  };

  return (
    <>
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
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="#111827"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <h2 className="font-semibold text-[#034792]">Filters</h2>
          </div>

          {/* Content */}
          <div
            className="max-h-[75dvh] overflow-y-auto overscroll-contain"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            <KidFilter
              hobbies={hobbies}
              setHobbies={setHobbies}
              age={age}
              setAge={setAge}
              gender={gender}
              setGender={setGender}
              filter={handleApplyFromKidFilter}
            />
          </div>
        </div>
      </div>
    </>
  );
}
