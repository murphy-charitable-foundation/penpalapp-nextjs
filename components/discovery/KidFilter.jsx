"use client";

import React, { useState, useMemo } from "react";
import Dropdown from "../general/Dropdown";
import HobbySelect from "../general/HobbySelect";

const PRIMARY = "#4E802A";
const ACCENT = "#0EA5A8";

const AGE_BRACKETS = [
  { label: "Age 6 and below", min: 0, max: 6 },
  { label: "Age 7 - 14", min: 7, max: 14 },
  { label: "Age 15 - 18", min: 15, max: 18 },
];

export default function KidFilter({ filter }) {
  const genderOptions = ["Male", "Female", "Non-binary"];

  const [hobbies, setHobbies] = useState([]);
  const [gender, setGender] = useState(null);
  const [age, setAge] = useState(null);

  const ageLabel = useMemo(() => {
    if (!age) return "";
    const match = AGE_BRACKETS.find(
      (b) => b.min === age.min && b.max === age.max
    );
    return match ? match.label : "";
  }, [age]);

  const isDirty = hobbies.length > 0 || Boolean(gender) || Boolean(age);

  const applyFilter = (e) => {
    e.preventDefault();
    filter?.({ age, gender, hobbies });
  };

  const clearFilter = () => {
    setHobbies([]);
    setGender(null);
    setAge(null);
    filter?.({ age: null, gender: null, hobbies: [] });
  };

  return (
    <form
      onSubmit={applyFilter}
      className="w-full bg-white"
      style={{ ["--accent"]: ACCENT }}
    >
      <div className="px-5 py-5 space-y-5">
        <div>
          <label className="block mb-1 text-xs font-medium text-gray-600">
            Hobbies
          </label>
          <HobbySelect
            value={hobbies}
            onChange={setHobbies}
            allowCustom={false}
            editable={false}
            placeholder="Select hobbies"
          />
        </div>

        <div>
          <label className="block mb-1 text-xs font-medium text-gray-600">
            Gender
          </label>
          <Dropdown
            options={genderOptions}
            currentValue={gender || ""}
            valueChange={(v) => setGender(v || null)}
            placeholder="Select gender"
          />
        </div>

        <div>
          <label className="block mb-1 text-xs font-medium text-gray-600">
            Age
          </label>
          <Dropdown
            options={AGE_BRACKETS.map((b) => b.label)}
            currentValue={ageLabel}
            valueChange={(label) => {
              const b = AGE_BRACKETS.find((x) => x.label === label);
              setAge(b ? { min: b.min, max: b.max } : null);
            }}
            placeholder="Select age range"
          />
        </div>

        <div className="pt-4 flex flex-col items-center gap-3">
          <button
            type="submit"
            disabled={!isDirty}
            className={`w-full h-10 rounded-full text-sm font-semibold ${
              isDirty ? "text-white" : "bg-gray-200 text-gray-500"
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
