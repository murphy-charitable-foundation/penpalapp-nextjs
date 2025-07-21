
"use client";

import React, { useState, useEffect } from "react";
import Input from "../Input";
import Button from "../Button";
import Dropdown from "../Dropdown";

export default function AdmminFilter({
  setStatus,
  status,
  setStart,
  start,
  setEnd,
  end,
  filter,
}) {
  const [statusFilter, setStatusFilter] = useState(status || "");
  const [startFilter, setStartFilter] = useState(start || "2025-01-01");
  const [endFilter, setEndFilter] = useState(end || "2025-01-01");

  useEffect(() => {
    setStatusFilter(status || "");
    setStartFilter(start !== 0 && start !== null ? start : "");
    setEndFilter(end || "");
  }, [status, start, end]);



  const applyFilter = (e) => {
    e.preventDefault();
    filter(statusFilter, startFilter, endFilter);
  };



  const clearFilter = () => {
    setStatus(null);
    setStart(null);
    setEnd(null);
    setStatusFilter([]);
    setStartFilter("");
    setEndFilter("");
  };

  const genderOptions = ["Draft", "Approved", "Pending", "Rejected"];

  return (
    <div className="bg-white flex flex-col my-14 min-h-screen mx-10">
      <form className="flex flex-col gap-6">
        <div>
        <label for="start">Start date:</label>

        <input
          type="date"
          id="start"
          name="start"
          value={start}
          onChange={(e) => {setStartFilter(e.target.value)}}
          min="2018-01-01"
           />
        </div>
        <div>
          <label for="start">End date:</label>

          <input
            type="date"
            id="end"
            name="end"
            value={"end"}
            min={start}
            />
        </div>
        <div>
          <label
            htmlFor="gender"
            className="text-sm font-medium text-gray-700 block mb-2"
          >
            Status
          </label>
          
          <Dropdown
          options={genderOptions}
          valueChange={setStatusFilter}
          currentValue={statusFilter}
          text="Status"
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

