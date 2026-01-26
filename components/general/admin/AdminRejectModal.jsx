"use client";
import { useState } from "react";
import rejectionReasons from "./rejectionReasons";
import { ChevronLeft } from "lucide-react";


export default function AdminRejectModal({ letter, onSubmit, onClose }) {
  const [reason, setReason] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isExiting, setIsExiting] = useState(false);

  const exitAndClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 300);
  };

  if (!letter) return null;

  return (
    <div
      className={`
        fixed inset-0 z-[10000] flex bg-gray-100
        transition-all duration-300
        ${isExiting ? "translate-x-full opacity-0" : "translate-x-0 opacity-100"}
      `}
    >
      <div className="w-full max-w-lg mx-auto bg-white flex flex-col rounded-lg shadow-xl overflow-hidden">

        {/* HEADER */}
      <div className={`flex items-center px-4 py-3 text-white bg-primary`}>
            <button
            onClick={exitAndClose}
            className="flex items-center w-9 h-9 rounded-full hover:bg-white/10"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <h2 className="text-lg font-semibold mx-auto">
            {letter.name}
          </h2>
          <div className="w-9" />
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-6">

            <label className="block mb-1 text-sm font-medium text-gray-700">
              Reason
            </label>
            <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="
                    w-full
                    pl-3
                    pr-10
                    py-3
                    border
                    rounded-md
                    mb-6
                    appearance-none

                  "
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
            className="
              w-full
              border-b-2 border-gray-200
              focus:border-b-4
              focus:border-primary
              focus:outline-none
              resize-none
              px-4 py-5
              bg-gray-100
              text-gray-800
            "
            placeholder="Explanation"
          />
        </div>

        {/* ACTION BAR */}
        <div className="px-5 py-4 border-t bg-white">
         <button
            className="
              block
              w-2/5
              mx-auto
              py-4
              bg-red-500 
              hover:bg-red-600
              text-white
              rounded-full
              font-semibold
            "
            onClick={() => onSubmit(reason, feedback)}
          >
            Reject
          </button>
        </div>

      </div>
    </div>
  );
}
