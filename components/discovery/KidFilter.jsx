"use client";

import React, { useState, useEffect, useMemo } from "react";
import Dropdown from "../general/Dropdown";
import HobbySelect from "../discovery/HobbySelect";

const PRIMARY = "#4E802A";
const ACCENT = "#0EA5A8";

const AGE_BRACKETS = [
  { id: "under_6", label: "Age 6 and below", min: 0, max: 6 },
  { id: "7_14", label: "Age 7 - 14", min: 7, max: 14 },
  { id: "15_18", label: "Age 15 - 18", min: 15, max: 18 },
];

export default function KidFilter({
  hobbies = [],
  setHobbies,
  age,
  setAge,
  gender,
  setGender,
  filter,
}) {
  const genderOptions = ["Male", "Female", "Non-binary", "Other"];

  const [genderFilter, setGenderFilter] = useState(gender || "");
  const [ageFilter, setAgeFilter] = useState(null);

  useEffect(() => {
    setGenderFilter(gender || "");
    if (age?.min !== undefined && age?.max !== undefined) {
      const match = AGE_BRACKETS.find(
        (b) => b.min === age.min && b.max === age.max
      );
      setAgeFilter(match || null);
    } else {
      setAgeFilter(null);
    }
  }, [gender, age]);

  const isDirty = useMemo(() => {
    return (
      hobbies.length > 0 ||
      Boolean(genderFilter) ||
      Boolean(ageFilter)
    );
  }, [hobbies, genderFilter, ageFilter]);

  const applyFilter = (e) => {
    e.preventDefault();

    const ageRange = ageFilter
      ? { min: ageFilter.min, max: ageFilter.max }
      : null;

    filter({
      age: ageRange,
      gender: genderFilter || null,
      hobbies,
    });

    setAge(ageRange);
    setGender(genderFilter || null);
  };

  const clearFilter = () => {
    setHobbies([]);
    setGender(null);
    setAge(null);
    setGenderFilter("");
    setAgeFilter(null);

    filter({ age: null, gender: null, hobbies: [] });
  };

  return (
    <form
      onSubmit={applyFilter}
      className="w-full bg-white"
      style={{ ["--accent"]: ACCENT }}
    >
      <div className="px-5 py-5 space-y-5">
      {/* HOBBIES */}
        <div>
          <label className="block mb-1 text-xs font-medium text-gray-600">
           Hobbies
          </label>

         <HobbySelect
           value={hobbies}
           onChange={setHobbies}
           allowCustom
         />
        </div>


        {/* GENDER */}
        <div>
          <label className="block mb-1 text-xs font-medium text-gray-600">
            Gender
          </label>
          <Dropdown
            options={genderOptions}
            currentValue={genderFilter}
            valueChange={(v) => setGenderFilter(v || "")}
            placeholder="Select gender"
          />
        </div>

        {/* AGE */}
        <div>
          <label className="block mb-1 text-xs font-medium text-gray-600">
            Age
          </label>
          <Dropdown
            options={AGE_BRACKETS.map((b) => b.label)}
            currentValue={ageFilter?.label || ""}
            valueChange={(label) =>
              setAgeFilter(
                AGE_BRACKETS.find((b) => b.label === label) || null
              )
            }
            placeholder="Select age range"
          />
        </div>

        {/* BUTTONS */}
        <div className="pt-4 flex flex-col items-center gap-3">
          <button
            type="submit"
            disabled={!isDirty}
            className={`w-full h-10 rounded-full text-sm font-semibold ${
              isDirty
                ? "text-white"
                : "bg-gray-200 text-gray-500"
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
