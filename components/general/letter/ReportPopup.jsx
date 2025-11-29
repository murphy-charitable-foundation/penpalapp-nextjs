"use client";

import { useEffect, useState } from "react";
import { logError } from "@/app/utils/analytics";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { PageContainer } from "../PageContainer";

const ReportPopup = ({
  setShowPopup,
  setShowConfirmReportPopup,
  sender,
  content,
}) => {
  const [pathParams, setPathParams] = useState("");
  const auth = getAuth();
  useEffect(() => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      setPathParams(path); // Get the path parameters
    }
  }, []);

  async function handleButtonClick(content) {
    try {
      const excerpt = content.substring(0, 100) + "...";
      const receiver_email = auth.currentUser.email;
      const currentUrl = `${window.location.origin}${pathParams}`;
      const response = await fetch("/api/report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ receiver_email, currentUrl, sender, excerpt }), // Send data as JSON
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
    } catch (error) {
      logError(error, {
        description: "Could not send request to SendGrid",
      });
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
      <PageContainer
        maxWidth="sm"
        padding="p-4"
        bgColor="bg-transparent"
        className="!min-h-0 "
      >
        <div className="bg-white space-y-4 shadow-md w-full rounded-md p-4 flex flex-col items-center">
          <h1 className="font-semibold text-sm text-red-500">
            Are you sure that you want to report this letter?
          </h1>
          <p className="text-gray-700 text-sm">
            This action will not be undone afterwards.
          </p>
          <div className="flex justify-between gap-2 w-full">
            <button
              type="button"
              onClick={() => setShowPopup(false)}
              className="w-24 rounded-full text-md font-bold py-3 px-4 bg-gray-300 hover:bg-gray-400 text-black disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                handleButtonClick(content);
                setShowPopup(false);
                setShowConfirmReportPopup(true);
              }}
              className="w-24 rounded-full text-md font-bold py-3 px-4 bg-red-500 hover:bg-red-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Report
            </button>
          </div>
        </div>
      </PageContainer>
    </div>
  );
};

export default ReportPopup;
