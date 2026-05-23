import StatusSuccessModal from "./StatusSuccessModal";

export default function SuccessModal({
  type,
  onClose = () => {},
  onRevert = () => {},
}) {
  if (type === "approved") {
    return (
      <StatusSuccessModal
        type="approved"
        title="Message Approved"
        description="The message has been approved and sent."
        primaryButtonText="Back to messages"
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
        primaryButtonText="Go to messages"
        onClose={onClose}
        onRevert={onRevert}
      />
    );
  }

  return null;
}