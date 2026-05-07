import ApproveSuccessModal from "./ApproveSuccessModal";
import RejectSuccessModal from "./RejectSuccessModal";

export default function SuccessModal({
  type,
  onClose = () => {},
  onRevert = () => {},
}) {
  if (type === "sent") {
    return <ApproveSuccessModal onClose={onClose} onRevert={onRevert} />;
  }

  if (type === "rejected") {
    return <RejectSuccessModal onClose={onClose} onRevert={onRevert} />;
  }

  return null;
}