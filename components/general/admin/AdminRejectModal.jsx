"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import rejectionReasons from "./rejectionReasons";
import { ChevronLeft } from "lucide-react";

export default function AdminRejectModal({ letter, onSubmit, onClose }) {
  const [mounted, setMounted] = useState(false);
  const [reason, setReason] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Ensure portal only runs on client
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !letter) return null;

  return createPortal(
    <div className="fixed top-0 left-0 w-screen h-screen z-[10000] bg-gray-100 flex items-start justify-center">
      <div className="w-full max-w-lg bg-white flex flex-col h-full overflow-hidden">

        {/* HEADER */}
        <div className="flex items-center px-4 h-14 text-white bg-red-600 rounded-t-xl">
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <h2 className="flex-1 text-center text-lg font-semibold truncate">
            {letter.name}
          </h2>

          <div className="w-10 h-10" />
        </div>

        {/* CONTENT (scrollable) */}
        <div className="flex-1 overflow-y-auto p-6">
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Reason
          </label>

          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full pl-3 pr-10 py-3 border border-red-300 rounded-md mb-6 appearance-none bg-white text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
          >
            <option value="" className="bg-white text-gray-900">
              Select a reason…
            </option>
            {rejectionReasons.map((r) => (
              <option key={r.category} value={r.category} className="bg-white text-gray-900">
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
            className="w-full border-b-2 border-gray-200 focus:border-b-4 focus:border-primary focus:outline-none resize-none px-4 py-5 bg-gray-100 text-gray-800"
            placeholder="Explanation"
          />

          {submitError && (
            <p className="mt-3 text-sm text-red-600 text-center">{submitError}</p>
          )}
        </div>

        {/* STICKY ACTION BAR */}
        <div className="bg-gray-50 border-t px-6 py-4">
          <button
            type="button"
            className="block w-2/5 mx-auto py-4 bg-red-500 hover:bg-red-600 text-white rounded-full font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-500"
            onClick={async () => {
              if (!reason.trim() || isSubmitting) return;
              setSubmitError("");
              setIsSubmitting(true);
              try {
                await onSubmit(reason, feedback);
              } catch (err) {
                console.error("Reject submit failed", err);
                setSubmitError("Could not submit rejection. Please try again.");
              } finally {
                setIsSubmitting(false);
              }
            }}
            disabled={!reason.trim() || isSubmitting}
          >
            {isSubmitting ? "Rejecting..." : "Reject"}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
