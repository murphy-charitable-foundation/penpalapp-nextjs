"use client";
import { useState } from "react";
import rejectionReasons from "./rejectionReasons";

export default function AdminRejectModal({ letter, onSubmit, onClose }) {
  const [reason, setReason] = useState("");
  const [feedback, setFeedback] = useState("");

  if (!letter) return null;

  return (
    <div className="fixed inset-0 z-[999] flex justify-center bg-black/30">
      <div className="w-full max-w-lg mx-auto bg-white flex flex-col rounded-lg shadow-xl">

        {/* HEADER */}
        <div className="flex items-center px-4 py-3 bg-secondary text-white relative">
          <button onClick={onClose} className="absolute left-4 text-xl">←</button>
          <h2 className="text-lg font-semibold mx-auto">Give Feedback</h2>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-6">

          <label className="block mb-1 text-sm font-medium text-gray-700">
            Reason
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full p-3 border rounded-md mb-6"
          >
            <option value="">Select a reason…</option>
            {rejectionReasons.map((r) => (
              <option key={r.category} value={r.category}>
                {r.category}
              </option>
            ))}
          </select>

          <label className="block mb-1 text-sm font-medium text-gray-700">
            Explanation
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="w-full border rounded-md p-3 h-32"
            placeholder="Write feedback here…"
          />
        </div>

        {/* ACTION BAR */}
        <div className="px-5 py-4 border-t bg-white">
          <button
            className="w-full py-3 bg-primary text-white rounded-md font-medium"
            onClick={() => onSubmit(reason, feedback)}
          >
            Submit
          </button>
        </div>

      </div>
    </div>
  );
}
