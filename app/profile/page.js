"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import { updateDoc } from "firebase/firestore";
import * as Sentry from "@sentry/nextjs";
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
import Button from "../../components/general/Button";
import Input from "../../components/general/Input";
import List from "../../components/general/List";
import { BackButton } from "../../components/general/BackButton";
import { PageContainer } from "../../components/general/PageContainer";
import { PageBackground } from "../../components/general/PageBackground";
import Dropdown from "../../components/general/Dropdown";
import ProfileSection from "../../components/general/profile/ProfileSection";
import Dialog from "../../components/general/Dialog";
import { PageHeader } from "../../components/general/PageHeader";
import LoadingSpinner from "../../components/loading/LoadingSpinner";
import BottomNavBar from '../../components/bottom-nav-bar';
import { usePageAnalytics } from "../useAnalytics";
import { logButtonEvent, logError } from "../utils/analytics";

export default function EditProfile() {
  // State initializations
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
  const [gender, setGender] = useState("");
  const [hobby, setHobby] = useState("");
  const [favoriteColor, setFavoriteColor] = useState("");
  const [photoUri, setPhotoUri] = useState("");
  const [user, setUser] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const [dialogTitle, setDialogTitle] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [userType, setUserType] = useState("international_buddy");

  // Modal state
  const [isEducationModalOpen, setIsEducationModalOpen] = useState(false);
  const [isGuardianModalOpen, setIsGuardianModalOpen] = useState(false);
  const [isOrphanModalOpen, setIsOrphanModalOpen] = useState(false);
  const [isBioModalOpen, setIsBioModalOpen] = useState(false);
  const [tempBio, setTempBio] = useState("");

  const router = useRouter();
  usePageAnalytics("/profile");

  useEffect(() => {
    const fetchUserData = async () => {
      if (auth.currentUser) {
        const uid = auth.currentUser.uid;
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
          setPhotoUri(userData.photo_uri || "");
          setUserType(userData.user_type || "");
        } else {
          console.log("No such document!");
        }
      }
    };
    fetchUserData();
  }, [auth.currentUser]);

  // Save profile data to Firestore
  const saveProfileData = async () => {
    if (auth.currentUser) {
      const uid = auth.currentUser.uid;
      const userProfileRef = doc(db, "users", uid);

      const userProfile = {
        first_name: firstName,
        last_name: lastName,
        email,
        birthday,
        country,
        village,
        bio,
        education_level: educationLevel,
        is_orphan: isOrphan.toLowerCase() === "yes" ? true : false,
        guardian: guardian,
        dream_job: dreamJob,
        hobby,
        favorite_color: favoriteColor,
        gender,
      };

      // Custom validation
      const newErrors = {};
      if (!userProfile.first_name.trim() && !userProfile.last_name.trim()) {
        newErrors.first_name = "Name is required";
        newErrors.last_name = "Name is required";
      }

      try {
        if (Object.keys(newErrors).length > 0) {
          setErrors(newErrors);
          throw new Error("Form validation error(s)");
        }
        await updateDoc(userProfileRef, userProfile);
        setIsSaved(true);
        setIsDialogOpen(true);
        setDialogTitle("Congratulations!");
        setDialogMessage("Profile saved successfully!");
      } catch (error) {
        setIsDialogOpen(true);
        setDialogTitle("Oops!");
        setDialogMessage("Error saving profile.");
        logError(error, {
          description: "Error saving profile ",
        });
      }
    }
  };

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

  // Education options
  const educationOptions = [
    "Elementary",
    "Middle",
    "High School",
    "College/University",
    "No Grade",
  ];

  // Guardian options
  const guardianOptions = [
    "Parents",
    "Adoptive Parents",
    "Aunt/Uncle",
    "Grandparents",
    "Other Family",
    "Friends",
    "Other",
  ];

  const orphanOptions = ["Yes", "No"];

  // Bio Modal content
  const bioModalContent = (
    <div className="space-y-4">
      <p className="text-sm text-gray-500 mb-2">
        Share your challenges or a brief bio:
      </p>
      <textarea
        value={tempBio}
        onChange={(e) => setTempBio(e.target.value)}
        className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
        placeholder="Write about yourself or challenges you've faced..."
        maxLength={200}
      />
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-500">
          {tempBio.length}/200 characters
        </span>
        <Button
          btnText="Save"
          color="bg-green-800"
          hoverColor="hover:bg-[#48801c]"
          textColor="text-white"
          rounded="rounded-lg"
          size="w-24"
          onClick={() => {
            setBio(tempBio);
            setIsBioModalOpen(false);
          }}
        />
      </div>
    </div>
  );

  // Open bio Modal and set temp bio
  const handleOpenBioModal = () => {
    setTempBio(bio);
    setIsBioModalOpen(true);
  };

const NAV_BAR_H = 88;     
const TOP_GAP = 8;
const GAP_BELOW = 2;

return (
  <div className="bg-gray-100 min-h-[103dvh] overflow-hidden flex flex-col">
    {/* --- Dialogا --- */}
    <Dialog
      isOpen={isDialogOpen}
      onClose={() => {
        setIsDialogOpen(false);
        if (isSaved) router.push("/letterhome");
      }}
      title={dialogTitle}
      content={dialogMessage}
    />
    <Dialog
      isOpen={isBioModalOpen}
      onClose={() => setIsBioModalOpen(false)}
      title="Bio/Challenges"
      content={bioModalContent}
      width="large"
    />
    
    <div className="flex-1 min-h-0" style={{ paddingTop: TOP_GAP }}>
      <div
        className="relative mx-auto w-full max-w-[29rem] rounded-2xl shadow-lg overflow-hidden flex flex-col min-h-0 bg-white"
        style={{
          height: `calc(103dvh - ${TOP_GAP}px - ${NAV_BAR_H}px - ${GAP_BELOW}px - env(safe-area-inset-bottom,0px))`,
        }}
      >
        <PageContainer
          width="compactXS"           // با بقیه صفحات هماهنگ
          padding="none"
          scroll={false}              // اسکرول فقط روی div داخلی
          bg="bg-white"
          viewportOffset={0}
          className="p-0 flex-1 min-h-0 flex flex-col overflow-hidden"
        >
          {/* اسکرول‌اریا داخل کارت */}
          <div
            className="flex-1 min-h-0 overflow-y-auto px-6 py-4 overscroll-contain"
            style={{
              WebkitOverflowScrolling: "touch",
              overflowAnchor: "none",
              paddingBottom: `calc(${NAV_BAR_H}px + 12px + env(safe-area-inset-bottom,0px))`,
            }}
          >
            {/* HEADER */}
            <PageHeader title="Profile" image={false} />

            <div className="max-w-none mx-auto">
              {/* PROFILE IMAGE */}
              <div className="my-6">
                <div className="relative w-40 h-40 mx-auto">
                  <Image
                    src={photoUri ? photoUri : "/murphylogo.png"}
                    fill
                    className="rounded-full object-cover"
                    alt="Profile picture"
                    priority
                  />
                </div>

                <div className="mt-4 flex justify-center">
                  <button
                    type="button"
                    onClick={() => router.push("/edit-profile-user-image")}
                    className="px-4 py-2 border border-gray-400 text-green-700 rounded-full hover:bg-gray-100 transition"
                  >
                    Edit Photo
                  </button>
                </div>
              </div>

              {/* FORM */}
              <div className="space-y-6">
                {/* PERSONAL INFO */}
                <ProfileSection title="Personal Information">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      label="First name"
                      error={errors.first_name || ""}
                    />
                    <Input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      label="Last name"
                      error={errors.last_name || ""}
                    />
                  </div>

                  <Input
                    type="text"
                    id="country"
                    name="country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    label="Country"
                  />

                  {userType !== "international_buddy" && (
                    <Input
                      type="text"
                      id="village"
                      name="village"
                      value={village}
                      onChange={(e) => setVillage(e.target.value)}
                      label="Village"
                    />
                  )}

                  {/* Bio Button */}
                  <div>
                    <p className="text-sm text-gray-500 mb-1">
                      Bio/Challenges faced
                    </p>
                    <button
                      onClick={handleOpenBioModal}
                      className="w-full border-b border-gray-300 p-2 text-left flex justify-between items-center"
                    >
                      <span className="truncate text-gray-800">
                        {bio || "Add your bio or challenges..."}
                      </span>
                      <svg
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0a3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7s-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    </button>
                  </div>

                  <Input
                    type="date"
                    id="birthday"
                    name="birthday"
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                    label="Birthday"
                  />
                </ProfileSection>

                {/* EDUCATION & FAMILY */}
                <ProfileSection
                  title={`Education ${
                    userType !== "international_buddy" ? "& Family" : ""
                  }`}
                >
                  <Dropdown
                    options={educationOptions}
                    currentValue={educationLevel}
                    valueChange={setEducationLevel}
                    text="Education Level"
                  />

                  {userType !== "international_buddy" && (
                    <>
                      <Dropdown
                        options={guardianOptions}
                        currentValue={guardian}
                        valueChange={setGuardian}
                        text="Guardian"
                      />
                      <Dropdown
                        options={orphanOptions}
                        currentValue={isOrphan}
                        valueChange={setIsOrphan}
                        text="Orphan Status"
                      />
                    </>
                  )}
                </ProfileSection>

                {/* INTEREST */}
                <ProfileSection title="Interest">
                  <Input
                    type="text"
                    id="dreamjob"
                    name="dreamjob"
                    value={dreamJob}
                    onChange={(e) => setDreamJob(e.target.value)}
                    label="Dream job"
                    placeholder="Airplane pilot"
                  />
                  <Input
                    type="text"
                    id="hobby"
                    name="hobby"
                    value={hobby}
                    onChange={(e) => setHobby(e.target.value)}
                    label="Hobby"
                    placeholder="Dancing"
                  />
                </ProfileSection>

                {/* FAVORITE COLOR */}
                <Input
                  type="text"
                  id="favoriteColor"
                  name="favoriteColor"
                  value={favoriteColor}
                  onChange={(e) => setFavoriteColor(e.target.value)}
                  label="Favorite Color"
                />

                {/* SAVE BUTTON */}
                <div className="flex justify-center my-4">
                  <Button
                    btnType="button"
                    btnText={isSaving ? <LoadingSpinner /> : "Save"}
                    color="green"
                    textColor="text-gray-200"
                    disabled={isSaving}
                    rounded="rounded-full"
                    onClick={saveProfileData}
                  />
                </div>
              </div>
            </div>
          </div>
        </PageContainer>
      </div>
    </div>

    <div style={{ height: `${NAV_BAR_H}px` }}>
      <BottomNavBar />
    </div>
  </div>
);



}
