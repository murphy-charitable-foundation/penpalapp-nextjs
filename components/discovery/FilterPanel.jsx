"use client";

import { useState, useEffect } from "react";
import KidFilter from "../discovery/KidFilter";

export default function FilterPanel({
  open,
  initial, // { age, pronouns, hobbies }
  onApply,
  onClose,
}) {
  const [hobbies, setHobbies] = useState([]);
  const [age, setAge] = useState(null);
  const [pronouns, setPronouns] = useState("");

  useEffect(() => {
    setHobbies(initial?.hobbies || []);
    setAge(initial?.age ?? null);
    setPronouns(initial?.pronouns || "");
  }, [initial, open]);

  const handleApplyFromKidFilter = (payload) => {
    onApply?.({
      age: payload?.age ?? null,
      pronouns: payload?.pronouns ?? "",
      hobbies: payload?.hobbies ?? [],
    });
  };

  if (!open) return null;

  return (
    <div className="mx-auto w-full max-w-[520px] rounded-2xl border border-gray-200 bg-white px-5 py-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Filters</h2>
          <p className="mt-1 text-sm text-gray-500">Refine the list of kids</p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
          aria-label="Close filters"
        >
          ✕
        </button>
      </div>

      <div className="space-y-6">
        <KidFilter
          hobbies={hobbies}
          setHobbies={setHobbies}
          age={age}
          setAge={setAge}
          pronouns={pronouns}
          setPronouns={setPronouns}
          filter={handleApplyFromKidFilter}
        />
      </div>
    </div>
  );
}