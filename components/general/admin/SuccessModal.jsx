import ApproveSuccessModal from "./ApproveSuccessModal";
import RejectSuccessModal from "./RejectSuccessModal";

export default function SuccessModal({ type, onClose }) {
  if (type === "approved") {
    return <ApproveSuccessModal onClose={onClose} />;
  }

  if (type === "rejected") {
    return <RejectSuccessModal onClose={onClose} />;
  }

  return null;
}