"use client";
import Image from "next/image";
import Button from "../../general/Button";


export default function AdminLetterReview({ letter, onApprove, onReject, onClose }) {
  if (!letter) return null;

  const status = letter.status;

  const sentAt = letter.lastMessageDate
    ? new Date(letter.lastMessageDate.seconds * 1000).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
<div className="fixed inset-0 z-[999] flex justify-center bg-black/30">
  <div className="w-full max-w-lg mx-auto bg-white flex flex-col rounded-lg shadow-xl">

    {/* TOP NAV */}
    <div className="flex items-center justify-between px-4 py-3 bg-secondary text-white shadow">
      <button
            onClick={onClose}
            className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-white/10"
          >
            <ChevronLeft size={22} strokeWidth={2.5} />
          </button>
      <h2 className="text-lg font-semibold">{letter.name || "Letter"}</h2>
      <div className="w-6" />
    </div>

    {/* BODY */}
<div className="flex-1 overflow-y-auto px-8 py-6">

  {/* SENDER INFO */}
  <div className="flex items-center justify-between mb-4">
  <div className="flex items-center gap-3">
    <Image
      src={letter.profileImage || "/usericon.png"}
      alt="sender"
      width={36}
      height={36}
      className="rounded-full object-cover"
    />
    <div>
      <div className="font-semibold text-gray-900 leading-tight">
        {letter.name}
      </div>
      <div className="text-sm text-gray-500 mt-0.5">
        To {letter.recipientName}
      </div>
    </div>
  </div>

  <div className="text-sm text-gray-500 whitespace-nowrap">
    {sentAt}
  </div>
</div>

  {/* ATTACHMENTS */}
  {letter.images?.length > 0 && (
    <div className="flex gap-3 mb-5">
      {letter.images.map((img, i) => (
        <Image
          key={i}
          src={img}
          alt={`attachment-${i}`}
          width={56}
          height={56}
          className="rounded-md object-cover"
        />
      ))}
    </div>
  )}

    {/* LETTER TEXT */}
    <div className="max-w-md">
      <p className="text-gray-700 text-base leading-loose whitespace-pre-wrap">
        {letter.lastMessage}
      </p>
    </div>
  </div>

  
      {/* ACTION BAR */}
      <div className="px-6 py-4 border-t bg-white">
  <div className="flex justify-between gap-4">
    {status === "pending_review" && (
      <>
        <Button
          btnText="Approve"
          onClick={onApprove}
          color="green"
        />
        <Button
          btnText="Reject"
          onClick={onReject}
          color="gray"
        />
      </>
    )}

    {(status === "sent" || status === "rejected") && (
      <Button
        btnText="Clear review"
        onClick={onClose}
        color="gray"
      />
    )}
  </div>
</div>
  </div>
</div>
  );
}
