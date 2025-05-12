import Link from "next/link";
import ProfileImage from "../ProfileImage";


export default function RecipientList({ recipients }) {
  if (!recipients?.length) return null;

  return (
    <div className="flex space-x-6 p-4 bg-[#F3F4F6] rounded-t-lg">
      {recipients.map(recipient => (
        <Link href={"/profile-view/" + recipient?.id}>
        <div key={recipient?.first_name?.[0]} className="flex items-center space-x-3">
          <ProfileImage 
            photo_uri={recipient?.photo_uri} 
            first_name={recipient?.first_name} 
            size={10}
          />
          <div>
            <h2 className="font-bold text-sm text-black">
              {recipient?.first_name} {recipient?.last_name}
            </h2>
            <p className="text-xs text-gray-500">{recipient?.country}</p>
          </div>
        </div>
        </Link>
      ))}
    </div>
  );
} 