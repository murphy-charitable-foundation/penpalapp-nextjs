"use client";

import React, { useState, useEffect } from "react";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { db } from "../../app/firebaseConfig";
import HobbySelect from "../general/HobbySelect";
import Input from "../general/Input";
import Button from "../general/Button";
import Dropdown from "../general/Dropdown";

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
  const [ageFilter, setAgeFilter] = useState(age !== 0 ? age : "");
  const [pronounsFilter, setPronounsFilter] = useState(pronouns || "");

  useEffect(() => {
    setHobbiesFilter(hobbies || []);
    setAgeFilter(age !== 0 && age !== null ? age : "");
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
    setHobbiesFilter([]);
    setAgeFilter("");
    setPronounsFilter("");
  };

  const pronounsOptions = ["Male", "Female", "Non-binary", "Other"];

  return (
    <div className="bg-white flex flex-col my-14 min-h-screen mx-10">
      <form className="flex flex-col gap-6">
        <div>
          <label
            htmlFor="village"
            className="text-sm font-medium text-gray-700 block mb-2"
          >
            Hobby
          </label>
          
          <HobbySelect setHobbies={setHobbiesFilter} hobbies={hobbyFilter} wantBorder={false}/>
        </div>
        <div>
          <label
            htmlFor="pronouns"
            className="text-sm font-medium text-gray-700 block mb-2"
          >
            Pronouns
          </label>
          
          <Dropdown
          options={pronounsOptions}
          valueChange={setPronounsFilter}
          currentValue={pronounsFilter}
          text="Pronouns"
          />
        </div>
        <div>
          <label
            htmlFor="age"
            className="text-md font-medium text-gray-700 block mb-2 px-2"
          >
            Age
          </label>
          <Input
            type="number"
            id="age"
            value={ageFilter}
            onChange={(e) => setAgeFilter(e.target.value)}
            placeholder="Input your age"
            size="w-full"
            padding="p-2"
            borderColor="border-black"
            textColor="text-black"
          />
        </div>
        <div className="flex justify-center mt-24">
          <div className="flex flex-col gap-2">
            <Button
              onClick={applyFilter}
              btnText="Apply Filters"
              color="blue"
              textColor="text-white"
              font="font-bold"
              rounded="rounded-3xl"
              size="w-full"
            />
            <Button
              onClick={clearFilter}
              btnText="Clear Filters"
              textColor="text-black"
              font="text-lg"
              size="w-full"
            />
          </div>
        </div>
      </form>
    </div>
  );
}

