"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../app/firebaseConfig";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import * as Sentry from "@sentry/nextjs";
import Modal from "../Modal";

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
    <Modal
      isOpen={true}
      onClose={() => setShowPopup(false)}
      variant="confirmation"
      title="Are you sure that you want to report this letter?"
      content="This action will not be undone afterwards."
      titleClassName="text-red-500"
      buttons={[
        {
          text: "Cancel",
          onClick: () => setShowPopup(false),
          variant: "secondary",
          className: "flex-1",
        },
        {
          text: "Report",
          onClick: () => {
            handleButtonClick(content);
            setShowPopup(false);
            setShowConfirmReportPopup(true);
          },
          variant: "primary",
          className: "flex-1",
        },
      ]}
    />
  );
};

export default ReportPopup;
