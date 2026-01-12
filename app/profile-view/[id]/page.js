"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, auth } from "../../firebaseConfig";
import { usePageAnalytics } from "../../useAnalytics";
import { logButtonEvent, logLoadingTime } from "../../utils/analytics";
import React from "react";

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
  Info,
  Mail,
} from "lucide-react";
import Button from "../../../components/general/Button";
import { BackButton } from "../../../components/general/BackButton";
import { PageContainer } from "../../../components/general/PageContainer";
import ProfileSection from "../../../components/general/profile/ProfileSection";
import InfoDisplay from "../../../components/general/profile/InfoDisplay";
import { PageHeader } from "../../../components/general/PageHeader";

/* ❗ If you add new fields to the user profile, update this file as well as the edit profile page */

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
  const [favoriteAnimal, setFavoriteAnimal] = useState("");
  const [profession, setProfession] = useState("");
  const [pronouns, setPronouns] = useState("");
  const [photoUri, setPhotoUri] = useState("");
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState("international_buddy");
  const [lastOnline, setLastOnline] = useState("");

  const router = useRouter();

  usePageAnalytics(`/profile-view/[id]`);

  useEffect(() => {
    const fetchUserData = async () => {
      if (auth.currentUser) {
        const uid = id;
        const docRef = doc(db, "users", uid);
        const docSnap = await getDoc(docRef);

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
          setGuardian(userData.guardian || "");
          setDreamJob(userData.dream_job || "");
          setHobby(userData.hobby || "");
          setFavoriteColor(userData.favorite_color || "");
          setFavoriteAnimal(userData.favorite_animal || "");
          setProfession(userData.profession || "");
          setPronouns(userData.pronouns || "");
          setPhotoUri(userData.photo_uri || "");
          setUserType(userData.user_type || "");
          setLastOnline(userData.last_online || "");
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
        <PageHeader title="View Profile" image={false} heading={false} />
        <div className="max-w-lg mx-auto pl-6 pr-6 pb-6">
          {/* Profile Image */}
          <div className="my-6">
              <div className="relative w-40 h-40 mx-auto">
                <Image
                  src={photoUri ? photoUri : "/murphylogo.png"}
                  layout="fill"
                  className="rounded-full"
                  alt="Profile picture"
                />
              </div>
            
            {auth.currentUser?.uid === id && (
              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  onClick={() => {
                    logButtonEvent(
                      "Edit profile button clicked!",
                      "/profile-view/[id]"
                    );
                    router.push("/profile");
                  }}
                  className="px-4 py-2 border border-gray-400 text-green-700 font-normal rounded-full hover:bg-gray-100 transition"
                >
                  Edit Profile
                </button>
              </div>
            )}
          </div>

          {/* Name, Country & Bio */}
          <div className="space-y-2 mb-6">
            <div className="text-center text-2xl font-bold">
              <span>
                {firstName != "" ? firstName : ""}{" "}
                {lastName != "" ? lastName : ""}
              </span>
            </div>
            <div className="text-center font-semibold">
              <span>{country != "" ? country : ""}</span>
            </div>
            <div className="text-center font-semibold text-gray-500">
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
            <ProfileSection title="Personal Information">
              <InfoDisplay title="Email" info={email}>
                <Mail className="w-5 h-5 text-black stroke-[2.5]" />
              </InfoDisplay>
              <InfoDisplay title="Pronouns" info={pronouns}>
                <Users className="w-5 h-5 text-black stroke-[2.5]" />
              </InfoDisplay>
              {userType == "international_buddy" && (
                <>
                  <InfoDisplay title="Profession" info={profession}>
                    <Briefcase className="w-5 h-5 text-black stroke-[2.5]" />
                  </InfoDisplay>
                  <InfoDisplay title="Favorite Animal" info={favoriteAnimal}>
                    <Heart className="w-5 h-5 text-black stroke-[2.5]" />
                  </InfoDisplay>
                  <InfoDisplay title="Hobby" info={hobby}>
                    <Square className="w-5 h-5 text-black stroke-[2.5]" />
                  </InfoDisplay>
                  <InfoDisplay title="Last Online" info={lastOnline}>
                    <Info className="w-5 h-5 text-black stroke-[2.5]" />
                  </InfoDisplay>
                </>
              )}
              {(userType == "child" || userType == "local_volunteer") && (
                <>
                  <InfoDisplay title="Birthday" info={birthday}>
                    <Calendar className="w-5 h-5 text-black stroke-[2.5]" />
                  </InfoDisplay>
                  <InfoDisplay title="Village" info={village}>
                    <Home className="w-5 h-5 text-black stroke-[2.5]" />
                  </InfoDisplay>
                  <InfoDisplay title="Is orphan" info={isOrphan}>
                    <Heart className="w-5 h-5 text-black stroke-[2.5]" />
                  </InfoDisplay>
                  <InfoDisplay title="Guardian" info={guardian}>
                    <Users className="w-5 h-5 text-black stroke-[2.5]" />
                  </InfoDisplay>
                  <InfoDisplay title="Education level" info={educationLevel}>
                    <GraduationCap className="w-5 h-5 text-black stroke-[2.5]" />
                  </InfoDisplay>
                  <InfoDisplay title="Dream Job" info={dreamJob}>
                    <Briefcase className="w-5 h-5 text-black stroke-[2.5]" />
                  </InfoDisplay>
                  <InfoDisplay title="Hobby" info={hobby}>
                    <Square className="w-5 h-5 text-black stroke-[2.5]" />
                  </InfoDisplay>
                  <InfoDisplay title="Favorite Animal" info={favoriteAnimal}>
                    <Heart className="w-5 h-5 text-black stroke-[2.5]" />
                  </InfoDisplay>
                  <InfoDisplay title="Favorite Color" info={favoriteColor}>
                    <Palette className="w-5 h-5 text-black stroke-[2.5]" />
                  </InfoDisplay>
                </>
              )}
            </ProfileSection>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
