"use client"

import React, {useState} from "react";

export default function KidFilter({ setHobbies, hobbies, setAge, age, setGender, gender }) {
  const [hobbieFilter, setHobbieFilter] = useState(null);
  const [ageFilter, setAgeFilter] = useState(null);
  const [genderFilter, setGenderFilter] = useState(null);

    const applyFilter = () => {
      setHobbies(hobbieFilter);
      setAge(ageFilter);
      setGender(genderFilter);
    }

    const clearFilter = () => {
      setHobbies(null);
      setAge(null);
      setGender(null);
    }

  return (
    <form>
      <div>
        <label
          htmlFor="hobbies"
          className="text-sm font-medium text-gray-700 block mb-2"
        >
          Hobbies
        </label>
        <input
          type="text"
          id="hobbies"
          value={hobbies}
          onChange={(e) => setHobbieFilter(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-md text-black"
        />
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
          value={gender}
          onChange={(e) => setGenderFilter(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-md text-black"
        >
          
        </select>
      </div>
      <div>
        <label
          htmlFor="age"
          className="text-sm font-medium text-gray-700 block mb-2"
        >
          Hobbies
        </label>
        <input
          type="text"
          id="age"
          value={hobbies}
          onChange={(e) => setAgeFilter(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-md text-black"
        />
      </div>
      <button onClick={applyFilter}>Apply Filters</button>
      <button onClikc={clearFilter}>Clear filters</button>
    </form>
  );
}
