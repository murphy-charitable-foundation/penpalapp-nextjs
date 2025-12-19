import Link from "next/link";
import ProfileImage from "../images/ProfileImage";

export default function ProfileHeader({ userName, country, profileImage, id }) {
  return (
    <header className="bg-blue-100 dark:bg-blue-100 border-b border-gray-200 rounded-none px-4 py-3">
      <Link
        href={`/profile-view/${id}`}
        className="flex items-center gap-2 sm:gap-3"
      >
        <ProfileImage
          photo_uri={profileImage}
          first_name={userName}
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-full ring-2 ring-white"
        />
        <div className="min-w-0">
          <div className="font-semibold text-lg !text-slate-900 dark:!text-slate-900 truncate">
            {userName || "—"}
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-700 truncate">
            {country || "—"}
          </div>
        </div>
      </Link>
    </header>
  );
}
