"use client";

import React, { useState, useEffect } from "react";
import HobbySelect from "../general/HobbySelect";

export default function KidFilter({
  setHobbies,
  hobbies,
  setAge,
  age,
  setGender,
  gender,
  filter,
}) {
  const [hobbyFilter, setHobbiesFilter] = useState(hobbies || []);
  const [ageFilter, setAgeFilter] = useState(age !== 0 ? age : "");
  const [genderFilter, setGenderFilter] = useState(gender || "");

  useEffect(() => {
    setHobbiesFilter(hobbies || []);
    setAgeFilter(age !== 0 && age !== null ? age : "");
    setGenderFilter(gender || "");
  }, [age, gender, hobbies]);

  const applyFilter = (e) => {
    e.preventDefault();
    filter(ageFilter, hobbyFilter, genderFilter);
  };

  const clearFilter = () => {
    setHobbies(null);
    setAge(null);
    setGender(null);
    setHobbiesFilter([]);
    setAgeFilter("");
    setGenderFilter("");
  };

  return (
    <div className="bg-white flex flex-col my-14 min-h-screen">
      <form className="flex flex-col gap-6">
        <div>
          <label
            htmlFor="village"
            className="text-sm font-medium text-gray-700 block mb-2"
          >
            Hobby
          </label>
          <HobbySelect setHobbies={setHobbiesFilter} hobbies={hobbyFilter} />
        </div>
        <div>
          <label
            htmlFor="gender"
            className="text-sm font-medium text-gray-700 block mb-2"
          >
            Gender
          </label>
          <select
            id="gender"
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md text-black"
          >
            <option value="">Select your gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Non-Binary">Non-Binary</option>
            <option value="Other">Other</option>
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
              onClick={applyFilter}
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
