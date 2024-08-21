import Button from "../Button";

const ReportPopup = ({ setShowPopup, setShowConfirmReportPopup }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
      <div className="bg-white space-y-4 shadow-md w-[300px] rounded-md p-4 flex flex-col items-center">
        <h1 className="font-semibold text-sm text-red-500">
          Are you sure that you want to report this letter?
        </h1>
        <p className="text-gray-700 text-sm">
          This action will not be undone afterwards.
        </p>
        <div className="flex justify-between gap-2 w-full">
          <Button onClick={() => setShowPopup(false)} type="info" size="sm">
            Cancel
          </Button>
          <Button
            onClick={() => {
              setShowPopup(false);
              setShowConfirmReportPopup(true);
            }}
            type="success"
            size="sm"
          >
            Report
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ReportPopup;
