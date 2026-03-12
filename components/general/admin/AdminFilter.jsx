
"use client";

import React, { useState, useEffect } from "react";
import Input from "../Input";
import Button from "../Button";
import Dropdown from "../Dropdown";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function AdminFilter({
  setStatus,
  status,
  setStart,
  start,
  setEnd,
  end,
  filter,
  clearFilters,
  loading,
  setLoading,
}) {
  const statusOptions = new Map([["Sent", "sent"], ["Pending Review", "pending_review"], ["Rejected", "rejected"]]);
  const statusLabels = new Map([["sent", "Sent"], ["pending_review", "Pending Review"], ["rejected", "Rejected"]]);

  const [statusFilter, setStatusFilter] = useState(status || "");
  const [startFilter, setStartFilter] = useState(start || "2025-01-01");
  const [endFilter, setEndFilter] = useState(end || "2025-01-01");
  const [currentFilter, setCurrentFilter] = useState(status ? statusLabels.get(status) : "");

  const toDateOrNull = (value) => {
    if (value == null || value === "") return null;
    if (value instanceof Date) return value;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  };

  useEffect(() => {
    setStatusFilter(status || "");
    setStartFilter(start !== 0 && start !== null ? start : "");
    setEndFilter(end || "");
    setCurrentFilter(status ? statusLabels.get(status) : "");
  }, [status, start, end]);



  const applyFilter = async(e) => {
    e.preventDefault();
    await filter(statusFilter, startFilter, endFilter);

  };



  const clearFilter = (e) => {
  e.preventDefault();
  clearFilters();
};


  return (
    <div className="bg-white rounded-xl border border-gray-200 mt-4 px-4 py-6">
      <form className="flex flex-col gap-6">
        <div className=" flex flex-row justify-between">
          <label className="text-black mt-[auto] mb-[auto]">Start date:</label>

          <DatePicker selected={toDateOrNull(startFilter)}
          placeholderText={"Select a date"}
          maxDate={toDateOrNull(endFilter)}
          onChange={(date) => setStartFilter(date ?? "")} 
          className="w-full px-4 py-2 border rounded-md shadow-sm text-black focus:outline-none focus:ring focus:border-blue-300"
          calendarClassName="rounded-lg shadow-xl bg-white border p-2 text-black" />
        </div>
        <div className="flex flex-row justify-between">
          <label className="text-black  mt-[auto] mb-[auto]" >End date:</label>

          <DatePicker selected={toDateOrNull(endFilter)}
           placeholderText={"Select a date"}
           minDate={toDateOrNull(startFilter)}
           onChange={(date) => setEndFilter(date ?? "")} 
           className="w-full px-4 py-2 text-black border rounded-md shadow-sm focus:outline-none focus:ring focus:border-blue-300"
           calendarClassName="rounded-lg shadow-xl bg-white border p-2"/>
        </div>
        <div>
          <label
            htmlFor="gender"
            className="text-sm font-medium text-gray-700 block mb-2"
          >
            Status
          </label>
          
          <Dropdown
          options={Array.from(statusOptions.keys())}
          valueChange={(optionValue) => { setStatusFilter(statusOptions.get(optionValue)); setCurrentFilter(optionValue); }}
          currentValue={currentFilter || statusLabels.get(status)}
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

