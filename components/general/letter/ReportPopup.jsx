"use client";

import Button from "../Button";
import { useEffect, useState } from "react";

import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../app/firebaseConfig";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import * as Sentry from "@sentry/nextjs";
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
      Sentry.captureException("Could not send request to SendGrid" + error);
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
      <PageContainer
        maxWidth="sm"
        padding="p-4"
        bgColor="bg-transparent"
        className="!min-h-0 ">
        <div className="bg-white space-y-4 shadow-md w-full rounded-md p-4 flex flex-col items-center">
          <h1 className="font-semibold text-sm text-red-500">
            Are you sure that you want to report this letter?
          </h1>
          <p className="text-gray-700 text-sm">
            This action will not be undone afterwards.
          </p>
          <div className="flex justify-between gap-2 w-full">
            <button
              onClick={() => setShowPopup(false)}
              btnType="button"
              btnText="Cancel"
              color="gray"
              textColor="gray"
              size="xs"
            />
            <button
              onClick={() => {
                handleButtonClick(content);
                setShowPopup(false);
                setShowConfirmReportPopup(true);
              }}
              btnType="button"
              btnText="Report"
              color="red"
              textColor="black"
              size="xs"
            />
          </div>
        </div>
      </PageContainer>
    </div>
  );
};

export default ReportPopup;
