"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, auth } from "../../firebaseConfig";

import {
  User,
  MapPin,
  Home,
  FileText,
  Calendar,
  GraduationCap,
  Users,
  Heart,
  Briefcase,
  Square,
  Palette,
} from "lucide-react";
import Button from "../../../components/general/Button";
import { BackButton } from "../../../components/general/BackButton";
import { PageContainer } from "../../../components/general/PageContainer";

export default function Page({ params }) {
  const { id } = params;
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [birthday, setBirthday] = useState("");
  const [country, setCountry] = useState("");
  const [village, setVillage] = useState("");
  const [bio, setBio] = useState("");
  const [educationLevel, setEducationLevel] = useState("");
  const [isOrphan, setIsOrphan] = useState(false);
  const [guardian, setGuardian] = useState("");
  const [dreamJob, setDreamJob] = useState("");
  //const [gender, setGender] = useState("");
  const [hobby, setHobby] = useState("");
  const [favoriteColor, setFavoriteColor] = useState("");
  const [photoUri, setPhotoUri] = useState("");
  const [user, setUser] = useState(null);

  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      if (auth.currentUser) {
        const uid = id;
        const docRef = doc(db, "users", uid);
        const docSnap = await getDoc(docRef);
        console.log(docSnap.data());

        if (docSnap.exists()) {
          const userData = docSnap.data();
          setFirstName(userData.first_name || "");
          setLastName(userData.last_name || "");
          setEmail(userData.email || "");
          setBirthday(userData.birthday || "");
          setCountry(userData.country || "");
          setVillage(userData.village || "");
          setBio(userData.bio || "");
          setEducationLevel(userData.education_level || "");
          setIsOrphan(userData.is_orphan ? "Yes" : "No");
          setGuardian(userData.gaurdian || "");
          setDreamJob(userData.dream_job || "");
          setHobby(userData.hobby || "");
          setFavoriteColor(userData.favorite_color || "");
          setPhotoUri(userData.photo_uri || "");
        } else {
          console.log("No such document!");
        }
      }
    };
    fetchUserData();
  }, [auth.currentUser]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        setUser(null);
        router.push("/login"); // Redirect to login page
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // User is signed out
      router.push("/login");
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <PageContainer maxWidth="lg" padding="p-6 pt-20">
        <BackButton />
        <div className="max-w-lg mx-auto p-6 pt-4">
          <div className="flex justify-end">
            <Button
              onClick={handleLogout}
              color="bg-red-500"
              textColor="text-white"
              hoverColor="hover:bg-red-600"
              btnType="submit"
              rounded="rounded-lg"
              btnText="Log out"
              size="w-24"
            />
          </div>

          {/* Profile Image */}
          <div className="my-6">
            <div className="relative w-24 h-24 mx-auto">
              <Image
                src={photoUri ? photoUri : "/murphylogo.png"}
                layout="fill"
                className="rounded-full"
                alt="Profile picture"
              />
              {/* Edit Icon */}
              {auth.currentUser.uid === id && (
                <div
                  className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full curspr-pointer"
                  onClick={() => {
                    router.push("/profile");
                  }}
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <defs>
                      <marker
                        id="arrow"
                        viewBox="0 0 10 10"
                        refX="5"
                        refY="5"
                        markerWidth="1"
                        markerHeight="1"
                        orient="auto-start-reverse"
                      >
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="white" />
                      </marker>
                    </defs>
                    <path
                      strokeWidth="4"
                      d="M18 6 L5 19"
                      markerEnd="url(#arrow)"
                    />
                    <path strokeWidth="4" d="M22 2 L19 5" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Name, Country & Bio */}
          <div className="space-y-1 mb-6">
            <div className="text-center text-2xl">
              <span>
                {firstName != "" ? firstName : ""}{" "}
                {lastName != "" ? lastName : ""}
              </span>
            </div>
            <div className="text-center">
              <span>{country != "" ? country : ""}</span>
            </div>
            <div className="text-center">
              <span>
                {bio ? "\u0022" : ""}
                {bio ? bio : ""}
                {bio ? "\u0022" : ""}
              </span>
            </div>
          </div>

          {/* Info */}
          <div className="space-y-8 mb-[120px]">
            {/* Personal Information Section */}
            <div className="space-y-4">
              <div className="h-4"></div>
              <h3 className="text-blue-900 font-medium text-sm mb-5">
                Personal Information
              </h3>
              <div className="h-4"></div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Home className="w-5 h-5 text-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Village</p>
                  <span className={village != "" ? "" : "text-gray-500"}>
                    {village != "" ? village : "Unknown"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Birthday</p>
                  <span className={birthday != "" ? "" : "text-gray-500"}>
                    {birthday || "Unknown"}
                  </span>
                </div>
              </div>
            </div>

            {/* Education & Family Section */}
            <div className="space-y-4">
              <div className="h-4"></div>
              <h3 className="text-blue-900 font-medium text-sm mb-4">
                Education & Family
              </h3>
              <div className="h-4"></div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <GraduationCap className="w-5 h-5 text-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Education level</p>
                  <span className={educationLevel != "" ? "" : "text-gray-500"}>
                    {educationLevel || "Unknown"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Users className="w-5 h-5 text-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Guardian</p>
                  <span className={guardian != "" ? "" : "text-gray-500"}>
                    {guardian || "Unknown"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Heart className="w-5 h-5 text-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Is orphan</p>
                  <span className={isOrphan != "" ? "" : "text-gray-500"}>
                    {isOrphan || "Unknown"}
                  </span>
                </div>
              </div>
            </div>

            {/* Interest Section */}
            <div className="space-y-4">
              <div className="h-4"></div>
              <h3 className="text-blue-900 font-medium text-sm mb-4">
                Interest
              </h3>
              <div className="h-4"></div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Briefcase className="w-5 h-5 text-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Dream Job</p>
                  <span className={dreamJob != "" ? "" : "text-gray-500"}>
                    {dreamJob != "" ? dreamJob : "Unknown"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Square className="w-5 h-5 text-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Hobby</p>
                  <span className={hobby != "" ? "" : "text-gray-500"}>
                    {hobby != "" ? hobby : "Unknown"}
                  </span>
                </div>
              </div>
            </div>

            {/* Favorite Color */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Palette className="w-5 h-5 text-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500">Favorite Color</p>
                <span className={favoriteColor != "" ? "" : "text-gray-500"}>
                  {favoriteColor != "" ? favoriteColor : "Unknown"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
