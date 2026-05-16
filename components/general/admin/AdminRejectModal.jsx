"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import rejectionReasons from "./rejectionReasons";
import { ChevronLeft } from "lucide-react";
import LoadingSpinner from "../../loading/LoadingSpinner";

export default function AdminRejectModal({ letter, onSubmit, onClose }) {
  const [mounted, setMounted] = useState(false);
  const [reason, setReason] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleReasonSelect = (selectedReason) => {
    setReason(selectedReason);

    const reasonData = rejectionReasons.find(
      (item) => item.category === selectedReason
    );

    setFeedback(reasonData?.feedback?.adult || "");
  };

  const handleSubmit = async () => {
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
  };

  if (!mounted || !letter) return null;

  return createPortal(
    <div className="fixed top-0 left-0 w-screen h-screen z-[10000] bg-gray-100 flex items-start justify-center">
      <div className="relative w-full max-w-lg bg-white flex flex-col h-full overflow-hidden">
        {isSubmitting && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/70">
            <LoadingSpinner />
          </div>
        )}

        <div
          className={`flex h-full flex-col transition-opacity duration-200 ${
            isSubmitting ? "pointer-events-none opacity-60" : ""
          }`}
        >
          <div className="flex items-center px-4 h-14 text-white bg-red-600 rounded-t-xl">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            <h2 className="flex-1 text-center text-lg font-semibold truncate">
              {letter.name}
            </h2>

            <div className="w-10 h-10" />
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Reason
            </label>

            <div className="space-y-3 mb-6">
              {rejectionReasons.map((item) => {
                const isSelected = reason === item.category;

                return (
                  <button
                    key={item.category}
                    type="button"
                    onClick={() => handleReasonSelect(item.category)}
                    disabled={isSubmitting}
                    className={`w-full rounded-xl border p-4 text-left transition disabled:cursor-not-allowed ${
                      isSelected
                        ? "border-red-500 bg-red-50 text-red-700"
                        : "border-gray-200 bg-white text-gray-800 hover:border-red-300 hover:bg-red-50"
                    }`}
                  >
                    <span className="block whitespace-normal break-words text-sm font-semibold leading-5">
                      {item.category}
                    </span>
                  </button>
                );
              })}
            </div>

            <label className="block mb-1 text-sm font-medium text-gray-700">
              Explanation
            </label>

            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              disabled={isSubmitting}
              className="w-full min-h-40 border-b-2 border-gray-200 focus:border-b-4 focus:border-primary focus:outline-none resize-none px-4 py-5 bg-gray-100 text-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
              placeholder="Explanation"
            />

            {submitError && (
              <p className="mt-3 text-sm text-red-600 text-center">
                {submitError}
              </p>
            )}
          </div>

          <div className="bg-gray-50 border-t px-6 py-4">
            <button
              type="button"
              className="block w-2/5 mx-auto py-4 bg-red-500 hover:bg-red-600 text-white rounded-full font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-500"
              onClick={handleSubmit}
              disabled={!reason.trim() || isSubmitting}
            >
              {isSubmitting ? "Rejecting..." : "Reject"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}