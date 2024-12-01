import Button from "../Button";
import { FaExclamationCircle } from "react-icons/fa";

const ConfirmReportPopup = ({ setShowPopup }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
      <div className="bg-white space-y-2 shadow-md w-[300px] rounded-md p-4 flex flex-col items-center">
        <FaExclamationCircle className="text-green-700 h-10 w-10" />
        <h1 className="font-semibold text-green-700">Was Successful</h1>
        <p className="text-gray-700 text-sm">
          Thank you for reporting the inappropriate message. We greatly
          appreciate your feedback, as it helps us improve. Our team will review
          the content of the message.
        </p>
        <div className="flex justify-around w-full">
          <Button onClick={() => setShowPopup(false)} type="success" size="sm">
            Got It
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmReportPopup;
