"use client";

import { useState, useEffect } from "react";
import rejectionReasons from "./rejectionReasons";
import { ChevronLeft } from "lucide-react";
import LoadingSpinner from "../../loading/LoadingSpinner";

export default function AdminRejectModal({ message, onSubmit, onClose }) {
  const [reason, setReason] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
  if (!message) return;
  setReason(message.rejection_reason || "");
  setFeedback(message.rejection_feedback || "");
}, [message]);

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

  if (!message) return null;

  return (
    <div className="h-full bg-gray-100">
      <div className="relative h-full bg-white flex flex-col overflow-hidden">
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
          <div className="flex items-center px-4 h-16 text-white bg-red-600">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            <h2 className="flex-1 text-center text-lg font-semibold truncate">
              {message.name}
            </h2>

            <div className="w-10 h-10" />
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <label className="block mb-3 text-sm font-medium text-gray-700">
                Rejection Reason
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
                      className={`w-full rounded-2xl border p-4 text-left transition disabled:cursor-not-allowed ${
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

              <label className="block mb-2 text-sm font-medium text-gray-700">
                Explanation
              </label>

              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                disabled={isSubmitting}
                className="w-full min-h-40 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 text-gray-800 focus:border-red-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                placeholder="Provide additional feedback..."
              />

              {submitError && (
                <p className="mt-3 text-sm text-red-600 text-center">
                  {submitError}
                </p>
              )}
            </div>
          </div>

          <div className="shrink-0 border-t bg-white px-6 py-4">
            <div className="flex justify-center">
              <button
                type="button"
                className="rounded-full bg-red-500 px-10 py-3 font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={handleSubmit}
                disabled={!reason.trim() || isSubmitting}
              >
                {isSubmitting ? "Rejecting..." : "Reject"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}