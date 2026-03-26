import Image from "next/image";
import { FaExclamationCircle } from "react-icons/fa";

export default function MessageBubble({
  message,
  isOwnMessage,
  onReport
}) {
  return (
    <div className={`w-[35%] flex bg-white p-4 rounded-lg text-gray-600 mb-4 ${isOwnMessage && "self-end"}`}>
      <div className="flex flex-col w-[90%]">
        {message?.attachments?.length ? (
          <Image
            alt="attachment"
            width={100}
            height={100}
            src={message.attachments[0]}
          />
        ) : null}
        <span>{message.content}</span>
        <section className="px-5">
          <div className="flex justify-end mb-2">
            <FaExclamationCircle
              className="cursor-pointer hover:text-red-500 transition-colors"
              onClick={onReport}
            />
          </div>
        </section>
      </div>
    </div>
  );
} 