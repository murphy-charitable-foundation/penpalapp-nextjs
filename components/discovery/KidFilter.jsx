"use client";

import React, { useMemo } from "react";
import Dropdown from "../general/Dropdown";
import HobbySelect from "../general/HobbySelect";

const PRIMARY = "#4E802A";
const ACCENT = "#0EA5A8";

const AGE_BRACKETS = [
  { label: "Age 6 and below", min: 0, max: 6 },
  { label: "Age 7 - 14", min: 7, max: 14 },
  { label: "Age 15 - 18", min: 15, max: 18 },
];

export default function KidFilter({
  filter,
  hobbies,
  setHobbies,
  age,
  setAge,
  pronouns,
  setPronouns,
}) {
  const pronounsOptions = ["He/Him", "She/Her", "Other"];

  const ageLabel = useMemo(() => {
    if (!age) return "";
    const match = AGE_BRACKETS.find(
      (b) => b.min === age.min && b.max === age.max
    );
    return match ? match.label : "";
  }, [age]);

  const isDirty = hobbies.length > 0 || Boolean(pronouns) || Boolean(age);

  const applyFilter = (e) => {
    e.preventDefault();
    filter?.({ age, pronouns, hobbies });
  };

  const clearFilter = () => {
    setHobbies([]);
    setPronouns(null);
    setAge(null);
    filter?.({ age: null, pronouns: null, hobbies: [] });
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
            Pronouns
          </label>
          <Dropdown
            options={pronounsOptions}
            currentValue={pronouns || ""}
            valueChange={(v) => setPronouns(v || null)}
            placeholder="Select pronouns"
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
