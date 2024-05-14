"use client";

import React, { useState, useEffect } from "react";
import HobbySelect from "../general/HobbySelect";

export default function KidFilter({
  setHobbies,
  hobbies,
  setAge,
  age,
  setPronouns,
  pronouns,
  filter,
}) {
  const [hobbyFilter, setHobbiesFilter] = useState(hobbies || []);
  const [ageFilter, setAgeFilter] = useState(age || 0);
  const [pronounsFilter, setPronounsFilter] = useState(pronouns || "");

  useEffect(() => {
    setHobbiesFilter(hobbies || []); 
    setAgeFilter(age || 0); 
    setPronounsFilter(pronouns || ""); 
  }, [age, pronouns, hobbies]);

  const applyFilter = (e) => {
    e.preventDefault();
    filter(ageFilter, hobbyFilter, pronounsFilter);
  };

  const clearFilter = () => {
    setHobbies(null);
    setAge(null);
    setPronouns(null);
  };

  return (
    <div className=" bg-white flex flex-col my-14">
      <form className="flex flex-col gap-6">
        <HobbySelect setHobbies={setHobbiesFilter} hobbies={hobbyFilter} />
        <div>
          <label
            htmlFor="pronouns"
            className="text-sm font-medium text-gray-700 block mb-2"
          >
            Pronouns
          </label>
          <select
            id="pronouns"
            value={pronounsFilter}
            onChange={(e) => setPronounsFilter(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md text-black"
          >
            <option value="">Select your pronouns</option>
            <option value="He/Him">He/Him</option>
            <option value="She/Her">She/Her</option>
            <option value="They/Them">They/Them</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label
            htmlFor="age"
            className="text-md font-medium text-gray-700 block mb-2 px-2"
          >
            Age
          </label>
          <input
            type="number"
            id="age"
            value={ageFilter}
            onChange={(e) => setAgeFilter(e.target.value)}
            className="w-full p-2 border-b border-black text-black outline-none"
            placeholder="Input age"
          />
        </div>
        <div className="flex justify-center mt-24">
          <div className="flex flex-col gap-2">
            <button
              onClick={(e) => applyFilter(e)}
              className="bg-[#4E802A] text-white text-lg font-bold py-2 px-4 rounded-3xl"
            >
              Apply Filters
            </button>
            <button onClick={clearFilter} className="text-black text-lg">
              Clear Filters
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
