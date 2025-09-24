import { FaExclamationCircle } from "react-icons/fa";
import Dialog from "../Modal";

const ConfirmReportPopup = ({ setShowPopup }) => {
  return (
    <Dialog
      isOpen={true}
      onClose={() => setShowPopup(false)}
      variant="alert"
      title="Was Successful"
      titleClassName="text-green-700"
      content={
        <>
          <FaExclamationCircle className="text-green-700 h-10 w-10 mx-auto mb-2" />
          <p>
            Thank you for reporting the inappropriate message. We greatly
            appreciate your feedback, as it helps us improve. Our team will
            review the content of the message.
          </p>
        </>
      }
      buttons={[
        {
          text: "Got It",
          onClick: () => setShowPopup(false),
          variant: "primary",
        },
      ]}
    />
  );
};

export default ConfirmReportPopup;
