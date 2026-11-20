
"use client";

import { useState } from "react";
import Link from "next/link";

export default function PolicyConsentModal({
  onAccept,
  onDecline,
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const handleAccept = async () => {
    setIsSaving(true);
    setError("");

    try {
      await onAccept();
    } catch (err) {
      console.error("Failed to save policy consent:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="policy-consent-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2
          id="policy-consent-title"
          className="mb-4 text-xl font-semibold text-gray-900"
        >
          Updated Privacy Policy and Terms
        </h2>

        <p className="mb-4 text-sm leading-6 text-gray-700">
          We&apos;ve updated our Privacy Policy and Terms and Conditions.
        </p>

        <div className="mb-6 flex flex-col gap-2 text-sm">
          <Link
            href="/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-700 underline"
          >
            Read Privacy Policy
          </Link>

          <Link
            href="/terms-conditions"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-700 underline"
          >
            Read Terms and Conditions
          </Link>
        </div>

        {error && (
          <p role="alert" className="mb-4 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={handleAccept}
            disabled={isSaving}
            className="rounded-lg bg-green-700 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Accept and Proceed to the App"}
          </button>

          <button
            type="button"
            onClick={onDecline}
            disabled={isSaving}
            className="rounded-lg border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-800 disabled:opacity-50"
          >
            Decline and Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
