import React, { useState } from "react";

export default function KidFilter({ setHobbies, hobbies, setAge, age, setGender, gender, filter }) {
  const [hobbieFilter, setHobbieFilter] = useState(null);
  const [ageFilter, setAgeFilter] = useState(null);
  const [genderFilter, setGenderFilter] = useState(null);

  const applyFilter = (e) => {
    e.preventDefault();
    
    setHobbies(hobbieFilter);
    if(ageFilter) {
      console.log(ageFilter)
      setAge(28);
    }

    setGender(genderFilter);
    filter();

  }

  const clearFilter = () => {
    setHobbies(null);
    setAge(null);
    setGender(null);
  }

  return (
    <div className=" bg-white flex flex-col my-14">
    <form className="flex flex-col gap-6">
      <div className="flex-grow">
        <label
          htmlFor="hobbies"
          className="text-md font-medium text-gray-700 block mb-2 px-2"
        >
          Hobbies
        </label>
        <input
          type="text"
          id="hobbies"
          value={hobbies}
          onChange={(e) => setHobbieFilter(e.target.value)}
          className="w-full p-2 border-b border-black text-black outline-none"
          placeholder="Ex: Football, baseball"
        />
      </div>
      <div>
        <label
          htmlFor="gender"
          className="text-md font-medium text-gray-700 block mb-2 px-2"
        >
          Gender
        </label>
        <select
          id="gender"
          value={gender}
          onChange={(e) => setGenderFilter(e.target.value)}
          className="w-full p-2 border-b border-black text-black outline-none"
          placeholder="Select a option"
        >
          {/* Add options for gender */}
          <option value="male">Male</option>
          <option value="female">Female</option>
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
        <button onClick={(e) => applyFilter(e)} className="bg-[#4E802A] text-white text-lg font-bold py-2 px-4 rounded-3xl">
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
