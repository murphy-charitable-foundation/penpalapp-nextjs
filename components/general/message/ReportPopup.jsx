"use client";


import { getAuth } from "firebase/auth";
import Dialog from "../Dialog";
import { logError } from "../../../app/utils/analytics";

const ReportPopup = ({
  setShowPopup,
  setShowConfirmReportPopup,
  sender,
  messageSummary,
}) => {
  const auth = getAuth();

  async function handleButtonClick() {
    try {
      const token = await auth.currentUser.getIdToken(true);
      const receiver_email = auth.currentUser.email;
      const currentUrl = `${window.location.origin}${window.location.pathname}`;
      const response = await fetch("/api/report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          receiver_email,
          currentUrl,
          sender,
          messageSummary,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
    } catch (error) {
      logError(error, {
        description: "Could not send request to Email Service Provider",
      });
    }
  }

  return (
    <Dialog
      isOpen={true}
      onClose={() => setShowPopup(false)}
      variant="confirmation"
      title="Are you sure that you want to report this message?"
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
            handleButtonClick();
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
