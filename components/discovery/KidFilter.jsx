"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Dropdown from "../general/Dropdown";

const LIGHT_BLUE = "#E6EDF4";
const DIVIDER = "#D9E5F0";
const PRIMARY = "#4E802A";   // Apply button
const ACCENT = "#0EA5A8";    // teal when active

function MultiSelectDropdown({
  options = [],
  value = [],
  onChange,
  placeholder = "Select...",
  className = "",
  summaryMax = 30,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const toggleVal = (v) => {
    const exists = value.includes(v);
    const next = exists ? value.filter((x) => x !== v) : [...value, v];
    onChange?.(next);
  };

  const summary = (() => {
    if (!value?.length) return "";
    const s = value.join(", ");
    return s.length > summaryMax ? `${s.slice(0, summaryMax)}…` : s;
  })();

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        className="w-full h-11 px-4 flex items-center justify-between bg-transparent"
        onClick={() => setOpen((o) => !o)}
      >
        <span className={`truncate ${value?.length ? "text-gray-900" : "text-gray-500"}`}>
          {value?.length ? summary : placeholder}
        </span>
        <span className="text-gray-600">▾</span>
      </button>

      {open && (
        <div
          className="absolute z-20 mt-1 w-full max-h-56 overflow-auto rounded-lg border border-gray-200 bg-white shadow-md"
          role="listbox"
        >
          {options.length === 0 && (
            <div className="px-3 py-2 text-sm text-gray-500">No options</div>
          )}
          {options.map((opt) => {
            const checked = value.includes(opt);
            return (
              <label
                key={opt}
                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer"
              >
                <input type="checkbox" className="h-4 w-4" checked={checked} onChange={() => toggleVal(opt)} />
                <span className="text-gray-900">{opt}</span>
              </label>
            );
          })}
          {value?.length > 0 && (
            <div className="sticky bottom-0 bg-white border-t border-gray-100 flex items-center justify-between px-3 py-2">
              <span className="text-xs text-gray-600">{value.length} selected</span>
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-xs text-gray-700 underline underline-offset-2 hover:text-gray-900"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function KidFilter({
  setHobbies, hobbies,
  setAge, age,
  setGender, gender,
  filter,
}) {
  const hobbyOptions = ["Reading","Drawing","Music","Coding","Sports","Chess","Cooking","Gardening","Robotics","Dancing"];
  const genderOptions = ["Male", "Female", "Non-binary", "Other"];
  const ageOptions = Array.from({ length: 18 }, (_, i) => String(i + 1)); // 1..18

  const [hobbyFilter, setHobbiesFilter] = useState(hobbies || []);
  const [ageFilter, setAgeFilter] = useState(age ? String(age) : "");
  const [genderFilter, setGenderFilter] = useState(gender || "");

  useEffect(() => {
    setHobbiesFilter(hobbies || []);
    setAgeFilter(age ? String(age) : "");
    setGenderFilter(gender || "");
  }, [age, gender, hobbies]);

  const fieldLine = (active) =>
    `h-11 flex items-center border-b-2 ${active ? "border-[var(--accent)]" : "border-gray-300"} focus-within:border-[var(--accent)]`;

  const isDirty = useMemo(
    () => (hobbyFilter?.length || 0) > 0 || !!genderFilter || (ageFilter !== "" && ageFilter !== null),
    [hobbyFilter, genderFilter, ageFilter]
  );

  const applyFilter = (e) => {
    e?.preventDefault?.();
    const ageNum = ageFilter === "" ? null : Number(ageFilter);
    filter(ageNum, hobbyFilter, genderFilter);
  };

  const clearFilter = (e) => {
    e?.preventDefault?.();
    setHobbies?.(null);
    setAge?.(null);
    setGender?.(null);
    setHobbiesFilter([]);
    setAgeFilter("");
    setGenderFilter("");
  };

  return (
    <div className="w-full bg-white" style={{ ["--accent"]: ACCENT }}>
      <div className="sticky top-0 z-10 w-full">
        <div className="mx-4 mt-3 rounded-lg bg-[#E6EDF4] text-center text-[14px] text-[#1f2937] py-2">
          Find and choose your next pen pal
        </div>
      </div>

      <form className="w-full" onSubmit={applyFilter}>
        <div className="mx-auto w-full max-w-[560px] px-5 py-5 space-y-5">
          {/* Hobbies */}
          <div>
            <label className="block mb-1 text-xs font-medium text-gray-600">Hobbies</label>
            <div className={fieldLine((hobbyFilter?.length || 0) > 0)}>
              <MultiSelectDropdown
                options={hobbyOptions}
                value={hobbyFilter}
                onChange={setHobbiesFilter}
                placeholder="Select hobbies"
                className="w-full"
              />
            </div>
          </div>

          {/* Gender */}
          <div>
            <label className="block mb-1 text-xs font-medium text-gray-600">Gender</label>
            <div className={fieldLine(!!genderFilter)}>
              <Dropdown
                options={genderOptions}
                valueChange={setGenderFilter}
                currentValue={genderFilter || ""}
                text="Gender"     
                placeholder="Select gender"
                className="w-full h-11 bg-transparent border-0 ring-0 px-4"
                caretClass="text-gray-600"
              />
            </div>
          </div>

          {/* Age */}
          <div>
            <label className="block mb-1 text-xs font-medium text-gray-600">Age</label>
            <div className={fieldLine(ageFilter !== "" && ageFilter !== null)}>
              <Dropdown
                options={ageOptions}
                valueChange={setAgeFilter}
                currentValue={ageFilter || ""}        
                text="Age"
                placeholder="Select age"
                className="w-full h-11 bg-transparent border-0 ring-0 px-4"
                caretClass="text-gray-600"
              />
            </div>
          </div>

<<<<<<< HEAD
        {/* Actions – colors match page theme */}
        <div className="flex justify-center mt-2">
          <div className="flex flex-col gap-2 w-full">
            {/* Apply */}
            <Button
              onClick={applyFilter}
              btnText="Apply Filters"
              color="blue"
              textColor="text-white"
              font="font-semibold"
              rounded="rounded-full"
              className="hover:opacity-95 active:opacity-90"
            />
            {/* Clear (outlined) */}
            <Button
              onClick={clearFilter}
              btnText="Clear Filters"
              color="bg-white"
              textColor="text-[#034792]"
              rounded="rounded-full"
              className="ring-1"
              // inline style for consistent ring color across builds
              style={{ boxShadow: `0 0 0 1px ${BRAND.ring} inset` }}
            />
=======
          {/* Buttons */}
          <div className="mt-6 flex flex-col items-center gap-3">
            <button
              type="submit"
              disabled={!isDirty}
              className={`w-full sm:w-[220px] h-10 rounded-full text-sm font-semibold transition active:scale-95
                         ${!isDirty ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "text-white shadow-sm"}`}
              style={!isDirty ? {} : { backgroundColor: PRIMARY }}
            >
              Apply filters
            </button>
            <button
              type="button"
              onClick={clearFilter}
              className="text-[13px] text-gray-600 hover:text-gray-800 underline-offset-2 hover:underline"
            >
              Clear filters
            </button>
>>>>>>> 872c4e3 (Fixing LetterHome page, Discovery Page and removing Wrapper from About page)
          </div>
        </div>

        <div aria-hidden="true" className="h-3" />
      </form>
    </div>
  );
}
