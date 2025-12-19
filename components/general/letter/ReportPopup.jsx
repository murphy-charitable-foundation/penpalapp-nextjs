"use client";


import { getAuth, onAuthStateChanged } from "firebase/auth";
import { PageContainer } from "../PageContainer";
import Button from "../Button";
import { logError } from "../../../app/utils/analytics";


const ReportPopup = ({
  setShowPopup,
  setShowConfirmReportPopup,
  sender,
  content,
}) => {
  const auth = getAuth();

  async function handleButtonClick(content) {
    try {
      const excerpt = content.length > 100 ? content.substring(0, 100) + "..." : content;
      const receiver_email = auth.currentUser.email;
      const currentUrl = `${window.location.origin}${window.location.pathname}`;
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
      logError(error, {
        description: "Could not send request to SendGrid",
      });
    }
  }

  return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
        <PageContainer maxWidth="sm" padding="p-4" bgColor="bg-transparent" className="!min-h-0 ">
          <div className="bg-white space-y-4 shadow-md w-full rounded-md p-4 flex flex-col items-center">
            <h1 className="font-semibold text-sm text-red-500">
              Are you sure that you want to report this letter?
            </h1>
            <p className="text-gray-700 text-sm">
              This action will not be undone afterwards.
            </p>
            <div className="flex justify-between gap-2 w-full">
              <Button
                onClick={() => setShowPopup(false)}
                btnType="button"
                btnText="Cancel"
                color="gray"
                textColor="gray"
                size="xs"
              />
              <Button
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
