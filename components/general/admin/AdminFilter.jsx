"use client";

import { useState, useEffect } from "react";
import Button from "../Button";
import Dropdown from "../Dropdown";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const statusOptions = [
  { label: "Approved", value: "approved" },
  { label: "Pending Review", value: "pending_review" },
  { label: "Rejected", value: "rejected" },
];

const getStatusLabel = (value) =>
  statusOptions.find((option) => option.value === value)?.label || "";

const getStatusValue = (label) =>
  statusOptions.find((option) => option.label === label)?.value || "";

function normalizeFilterDate(value) {
  if (value == null || value === "" || value === 0) return "";

  if (typeof value?.toDate === "function") {
    const date = value.toDate();
    return date instanceof Date && !isNaN(date.getTime()) ? date : "";
  }

  if (value instanceof Date) {
    return isNaN(value.getTime()) ? "" : value;
  }

  const date = new Date(value);
  return isNaN(date.getTime()) ? "" : date;
}

function toDateOrNull(value) {
  if (value == null || value === "") return null;
  if (value instanceof Date) return value;

  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

export default function AdminFilter({
  status,
  start,
  end,
  filter,
  clearFilters,
}) {
  const [statusFilter, setStatusFilter] = useState(status || "");
  const [startFilter, setStartFilter] = useState(() =>
    normalizeFilterDate(start),
  );
  const [endFilter, setEndFilter] = useState(() => normalizeFilterDate(end));
  const [currentFilter, setCurrentFilter] = useState(
    status ? getStatusLabel(status) : "",
  );
  useEffect(() => {
    setStatusFilter(status || "");
    setStartFilter(normalizeFilterDate(start));
    setEndFilter(normalizeFilterDate(end));
    setCurrentFilter(status ? getStatusLabel(status) : "");
  }, [status, start, end]);

  const applyFilter = async (e) => {
    e.preventDefault();
    await filter(statusFilter, startFilter, endFilter);
  };

  const clearFilter = (e) => {
    e.preventDefault();
    clearFilters();
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 px-4 py-6">
      <form className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">
            Start date:
          </label>

          <DatePicker
            selected={toDateOrNull(startFilter)}
            placeholderText="Select a date"
            maxDate={toDateOrNull(endFilter)}
            onChange={(date) => setStartFilter(date ?? "")}
            className="w-full px-4 py-3 border rounded-xl shadow-sm text-black focus:outline-none focus:ring focus:border-blue-300"
            calendarClassName="rounded-lg shadow-xl bg-white border p-2 text-black"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">End date:</label>

          <DatePicker
            selected={toDateOrNull(endFilter)}
            placeholderText="Select a date"
            minDate={toDateOrNull(startFilter)}
            onChange={(date) => setEndFilter(date ?? "")}
            className="w-full px-4 py-3 text-black border rounded-xl shadow-sm focus:outline-none focus:ring focus:border-blue-300"
            calendarClassName="rounded-lg shadow-xl bg-white border p-2 text-black"
          />
        </div>

        <div>
          <label
            htmlFor="status"
            className="text-sm font-medium text-gray-700 block mb-2"
          >
            Status
          </label>

          <Dropdown
            options={statusOptions.map((option) => option.label)}
            valueChange={(optionLabel) => {
              setStatusFilter(getStatusValue(optionLabel));
              setCurrentFilter(optionLabel);
            }}
            currentValue={currentFilter || getStatusLabel(status)}
            text="Status"
          />
        </div>

        <div className="flex justify-center pt-6">
          <div className="flex flex-col gap-3 w-full max-w-xs">
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
