import Link from "next/link";
import { BsPaperclip } from "react-icons/bs";
import { MdSend } from "react-icons/md";
import { RiDeleteBin6Line } from "react-icons/ri";
import IconButton from "../IconButton";

export default function LetterHeader({
  attachmentsCount,
  onAttach,
  onSend,
  onDelete
}) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-300 bg-[#FAFAFA]">
      <Link href="/">
        <button onClick={() => window.history.back()}>
          <img src="/closeicon.svg" alt="Close" />
        </button>
      </Link>
      <button className="opacity-0">{"<"}</button>
      <div className="flex justify-between items-center p-4">
        <span className="text-black">{attachmentsCount} files</span>
        <div className="space-x-2">
          <IconButton icon={BsPaperclip} onClick={onAttach} ariaLabel="Attach file" />
          <IconButton icon={MdSend} onClick={onSend} ariaLabel="Send message" />
          <IconButton icon={RiDeleteBin6Line} onClick={onDelete} ariaLabel="Delete" />
        </div>
      </div>
    </div>
  );
} 