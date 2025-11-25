
"use client";

import React, { useState, useEffect } from "react";
import Input from "../Input";
import Button from "../Button";
import Dropdown from "../Dropdown";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

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


  const statusOptions = ["Sent", "Pending", "Rejected"];

  return (
    <div className="bg-white flex flex-col my-14 min-h-screen mx-10">
      <form className="flex flex-col gap-6">
        <div>
        <text className="text-black">Start date:</text>

        <DatePicker selected={startFilter}
         placeHolder={"Select A Date"}
         maxDate={endFilter} 
         onChange={(date) => setStartFilter(date)} 
         className="w-full px-4 py-2 border rounded-md shadow-sm text-black focus:outline-none focus:ring focus:border-blue-300"
         calendarClassName="rounded-lg shadow-xl bg-white border p-2 text-black" />
        </div>
        <div>
          <text className="text-black" >End date:</text>

          <DatePicker selected={endFilter}
           placeHolder={"Select A Date"}
           minDate={startFilter} 
           onChange={(date) => setEndFilter(date)} 
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
          options={statusOptions}
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

