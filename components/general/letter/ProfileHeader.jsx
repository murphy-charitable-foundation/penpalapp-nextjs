import Link from "next/link";
import ProfileImage from "../ProfileImage";

export default function ProfileHeader({ userName, country, profileImage }) {
  return (
    <header className="flex justify-between items-center bg-blue-100 p-5 border-b border-gray-200">
      <Link href="/profile">
        <button className="flex items-center text-gray-700">
          <div className="flex items-center">
            <ProfileImage photo_uri={profileImage} first_name={userName} />
            <div className="ml-3">
              <div className="font-semibold text-lg">{userName}</div>
              <div className="text-sm text-gray-600">{country}</div>
            </div>
          </div>
        </button>
      </Link>
    </header>
  );
} 