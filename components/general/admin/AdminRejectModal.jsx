"use client";
import { useState } from "react";
import rejectionReasons from "./rejectionReasons";

export default function AdminRejectModal({ letter, onSubmit, onClose }) {
  const [reason, setReason] = useState("");
  const [feedback, setFeedback] = useState("");

  if (!letter) return null;

  return (
    <div className="fixed inset-0 bg-white z-[999] flex flex-col">

  {/* HEADER */}
    <div className="flex items-center p-4 border-b bg-[#F8EDED] relative">

      {/* Left Back Button + Label */}
      <button onClick={onClose} className="flex items-center text-gray-700 absolute left-4">
        <span className="text-xl mr-1">←</span>
        <span className="text-sm">Back to Letter</span>
      </button>

      {/* Centered Title */}
      <h2 className="text-lg font-semibold mx-auto">Give Feedback</h2>

    </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto p-6">

        {/* Reason Dropdown */}
        <label className="block mb-1 text-sm font-medium text-gray-600">
          Reason
        </label>

        <select
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full p-3 border rounded-lg mb-6 bg-white"
        >
          <option value="">Select a reason…</option>
          {rejectionReasons.map((r) => (
            <option key={r.category} value={r.category}>
              {r.category}
            </option>
          ))}
        </select>

        {/* Explanation */}
        <label className="block mb-1 text-sm font-medium text-gray-600">
          Explanation
        </label>

        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Write feedback here…"
          className="w-full border rounded-lg p-3 h-32"
        />
      </div>

      {/* BOTTOM SUBMIT BUTTON */}
      <div className="p-6 border-t bg-[#EAF0F3]">
        <button
          className="w-full py-3 bg-green-700 text-white rounded-full text-md font-medium"
          onClick={() => onSubmit(reason, feedback)}
        >
          Submit
        </button>
      </div>

    </div>
  );
}
