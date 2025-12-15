"use client";

import React, { useState, useEffect, useMemo } from "react";
import Dropdown from "../general/Dropdown";
import HobbySelect from "../../components/general/HobbySelect";

const PRIMARY = "#4E802A";
const ACCENT = "#0EA5A8";

export default function KidFilter({
  setHobbies,
  hobbies,
  setAge,
  age,
  setGender,
  gender,
  filter,
}) {
  const genderOptions = ["Male", "Female", "Non-binary", "Other"];

  const ageOptions = [
    { id: "under_6", label: "Age 6 and below", min: 0, max: 6 },
    { id: "7_14", label: "Age 7 - 14", min: 7, max: 14 },
    { id: "15_18", label: "Age 15 - 18", min: 15, max: 18 },
  ];

  const [genderFilter, setGenderFilter] = useState(gender || "");
  const [ageFilter, setAgeFilter] = useState(age || null);

  useEffect(() => {
    setGenderFilter(gender || "");
    setAgeFilter(age || null);
  }, [gender, age]);

  const isDirty = useMemo(
    () => (hobbies && hobbies.length > 0) || !!genderFilter || !!ageFilter,
    [hobbies, genderFilter, ageFilter]
  );

  const applyFilter = (e) => {
    e.preventDefault();
    filter(ageFilter, hobbies || [], genderFilter);
  };

  const clearFilter = () => {
    setHobbies([]);
    setGenderFilter("");
    setAgeFilter(null);
    setGender(null);
    setAge(null);
  };

  return (
    <form
      onSubmit={applyFilter}
      className="w-full bg-white"
      style={{ ["--accent"]: ACCENT }}
    >
      <div className="mx-auto max-w-[560px] px-5 py-5 space-y-5">
        {/* ===== HOBBIES ===== */}
        <div>
          <label className="block mb-1 text-xs font-medium text-gray-600">
            Hobbies
          </label>
          <div className="border-b-2 border-gray-300 focus-within:border-[var(--accent)]">
            <HobbySelect
              hobbies={hobbies || []}
              setHobbies={setHobbies}
              wantBorder={false}
            />
          </div>
        </div>

        {/* ===== GENDER ===== */}
        <div>
          <label className="block mb-1 text-xs font-medium text-gray-600">
            Gender
          </label>
          <Dropdown
            options={genderOptions}
            currentValue={genderFilter || ""}
            valueChange={(v) => setGenderFilter(v || "")}
            placeholder="Select gender"
            className="w-full h-11 bg-transparent"
          />
        </div>

        {/* ===== AGE ===== */}
        <div>
          <label className="block mb-1 text-xs font-medium text-gray-600">
            Age
          </label>
          <Dropdown
            options={ageOptions.map((o) => o.label)}
            currentValue={ageFilter ? ageFilter.label : ""}
            valueChange={(label) =>
              setAgeFilter(ageOptions.find((o) => o.label === label) || null)
            }
            placeholder="Select age range"
            className="w-full h-11 bg-transparent"
          />
        </div>

        {/* ===== BUTTONS ===== */}
        <div className="pt-4 flex flex-col items-center gap-3">
          <button
            type="submit"
            disabled={!isDirty}
            className={`w-full sm:w-[220px] h-10 rounded-full text-sm font-semibold
              ${
                isDirty
                  ? "text-white"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
              }`}
            style={isDirty ? { backgroundColor: PRIMARY } : {}}
          >
            Apply filters
          </button>

          <button
            type="button"
            onClick={clearFilter}
            className="text-xs text-gray-600 underline"
          >
            Clear filters
          </button>
        </div>
      </div>
    </form>
  );
}
