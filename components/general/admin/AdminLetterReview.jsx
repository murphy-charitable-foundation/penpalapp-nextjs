"use client";
import Image from "next/image";
import Button from "../../general/Button";

export default function AdminLetterReview({ letter, onApprove, onReject, onClose }) {
  if (!letter) return null;

  const sentAt = letter.lastMessageDate
    ? new Date(letter.lastMessageDate.seconds * 1000).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <div className="fixed inset-0 bg-white z-[999] flex flex-col overflow-hidden">

      {/* ----- TOP NAV BAR ----- */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#0a2c55] text-white shadow">
        <button onClick={onClose} className="text-xl font-bold">←</button>
        <h2 className="text-lg font-semibold">{letter.name || "Letter"}</h2>
        <div className="w-6"></div> {/* spacer */}
      </div>

      {/* ----- SENDER INFO ----- */}
      <div className="flex items-center gap-3 px-5 py-4 border-b">
        <Image
          src={letter.profileImage || "/usericon.png"}
          alt="sender"
          width={48}
          height={48}
          className="rounded-full object-cover"
        />

        <div className="flex-1">
          <div className="font-semibold">{letter.name}</div>
          <div className="text-gray-500 text-sm">To: {letter.toName || "Recipient"}</div>
        </div>

        <div className="text-xs text-gray-500">{sentAt}</div>
      </div>

      {/* ----- OPTIONAL IMAGES (if letter has any) ----- */}
      {letter.images?.length > 0 && (
        <div className="flex gap-3 px-5 py-4 overflow-x-auto">
          {letter.images.map((src, i) => (
            <Image
              key={i}
              src={src}
              width={80}
              height={80}
              alt="attached"
              className="rounded-md object-cover"
            />
          ))}
        </div>
      )}

      {/* ----- LETTER BODY (scrollable) ----- */}
      <div className="flex-1 overflow-y-auto px-5 py-2">
        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
          {letter.lastMessage}
        </p>
      </div>

      {/* ----- APPROVE / REJECT BAR ----- */}
      <div className="px-5 py-4 border-t bg-white flex gap-3">
        <Button
            btnText="Approve"
            onClick={onApprove}
            color="green"
            className="flex-1"
            />
            <Button
            btnText="Reject"
            onClick={onReject}
            color="red"
            className="flex-1"
            />

      </div>
    </div>
  );
}
