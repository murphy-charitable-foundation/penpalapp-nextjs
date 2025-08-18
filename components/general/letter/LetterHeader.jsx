import Link from "next/link";
import { BsPaperclip } from "react-icons/bs";
import { MdSend } from "react-icons/md";
import { RiDeleteBin6Line } from "react-icons/ri";
import IconButton from "../IconButton";
import Button from "../Button";
import Image from "next/image";

export default function LetterHeader({
  attachmentsCount,
  onAttach,
  onSend,
  onDelete,
}) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-300 bg-[#FAFAFA]">
      <Link href="/">
        <Button
          btnText={
            <Image src="/closeicon.svg" alt="Close" width={12} height={12} />
          }
          color="transparent"
          textColor="text-gray-400"
          size={"small"}
        />
      </Link>
      <Button
        btnText={"<"}
        color="bg-transparent"
        textColor="text-gray-400"
        hoverColor="hover:text-gray-600"
      />
      <div className="flex flex-row justify-between items-center p-2">
        <span className="text-black">{attachmentsCount} files</span>
        <div className="flex flex-row">
          <IconButton
            icon={BsPaperclip}
            onClick={onAttach}
            ariaLabel="Attach file"
          />
          <IconButton icon={MdSend} onClick={onSend} ariaLabel="Send message" />
          <IconButton
            icon={RiDeleteBin6Line}
            onClick={onDelete}
            ariaLabel="Delete"
          />
        </div>
      </div>
    </div>
  );
}
