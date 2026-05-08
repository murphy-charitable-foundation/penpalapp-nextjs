import StatusSuccessModal from "./StatusSuccessModal";

export default function SuccessModal({
  type,
  onClose = () => {},
  onRevert = () => {},
}) {
  if (type === "sent") {
    return (
      <StatusSuccessModal
        type="sent"
        title="Letter Approved"
        description="The letter has been approved and sent."
        primaryButtonText="Back to letters"
        onClose={onClose}
        onRevert={onRevert}
      />
    );
  }

  if (type === "rejected") {
    return (
      <StatusSuccessModal
        type="rejected"
        title="Rejection Feedback"
        description={`We sent the feedback to the user.\nThanks for your feedback.`}
        primaryButtonText="Go to letters"
        onClose={onClose}
        onRevert={onRevert}
      />
    );
  }

  return null;
}