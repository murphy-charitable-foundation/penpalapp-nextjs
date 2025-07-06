import Link from "next/link";
import ProfileImage from "../ProfileImage";
import Button from "../Button";

export default function ProfileHeader({ userName, country, profileImage, id }) {
  return (
    <header className="flex justify-between items-center bg-blue-100 p-5 border-b border-gray-200">
      <Link href={"/profile-view/" + id}>
        <Button
          btnText={
            <div className="flex items-center">
              <ProfileImage photo_uri={profileImage} first_name={userName} />
              <div className="ml-3">
              <div className="font-semibold text-lg">{userName}</div>
              <div className="text-sm text-gray-600">{country}</div>
            </div>
            </div>
          }
          color="bg-transparent"
          textColor="text-gray-700"
          hoverColor="hover:text-gray-600"
        />
      </Link>
    </header>
  );
} 