"use client";

import React, { useState, useEffect } from "react";
import HobbySelect from "../general/HobbySelect";
import Input from "../general/Input";
import Button from "../general/Button";
import Dropdown from "../general/Dropdown";

const BRAND = {
  primary: "#034792",   // page primary
  ring: "#03479266",    // ~40% opacity
  soft: "#E6EDF4",      // header light blue
};

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

  const genderOptions = ["Male", "Female", "Non-binary", "Other"];

  return (
    <div className="bg-white w-full">
      <form className="flex flex-col gap-5 px-2">
        {/* Hobby */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">
            Hobby
          </label>
          <div
            className="rounded-xl border p-2"
            style={{ borderColor: BRAND.soft }}
          >
            <HobbySelect
              setHobbies={setHobbiesFilter}
              hobbies={hobbyFilter}
              wantBorder={false}
            />
          </div>
        </div>

        {/* Gender */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">
            Gender
          </label>
          <div
            className="rounded-xl border px-2 py-2"
            style={{ borderColor: BRAND.soft }}
          >
            <Dropdown
              options={genderOptions}
              valueChange={setGenderFilter}
              currentValue={genderFilter}
              text="Gender"
            />
          </div>
        </div>

        {/* Age */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2 px-1">
            Age
          </label>
          <Input
            type="number"
            id="age"
            value={ageFilter}
            onChange={(e) => setAgeFilter(e.target.value)}
            placeholder="e.g., 12"
            size="w-full"
            padding="p-2"
            borderColor="border-gray-300"
            textColor="text-black"
          />
        </div>

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
          </div>
        </div>
      </form>
    </div>
  );
}
