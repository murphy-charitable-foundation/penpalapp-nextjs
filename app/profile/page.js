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
import { PageContainer } from "../../components/general/PageContainer";
import { PageBackground } from "../../components/general/PageBackground";
import Dropdown from "../../components/general/Dropdown";
import ProfileSection from "../../components/general/profile/ProfileSection";
import Dialog from "../../components/general/Dialog";
import { PageHeader } from "../../components/general/PageHeader";
import LoadingSpinner from "../../components/loading/LoadingSpinner";
import NavBar from '../../components/bottom-nav-bar';
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

return (
  <PageBackground className="bg-gray-100 h-screen flex flex-col overflow-hidden">
    {/* ===== DIALOGS ===== */}
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
      title="Bio / Challenges"
      content={bioModalContent}
      width="large"
    />

    {/* ===== MAIN AREA ===== */}
    <div className="flex-1 min-h-0 flex justify-center">
      <PageContainer
        width="compactXS"
        padding="none"
        center={false}
        className="
          min-h-[92dvh]
          flex flex-col
          bg-white
          rounded-2xl
          shadow-lg
          overflow-hidden
        "
      >
        {/* ===== HEADER ===== */}
        <PageHeader title="Profile" image={false} showBackButton />

        {/* ===== SCROLLABLE CONTENT (ONLY SCROLLER) ===== */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 py-4">

          {/* PROFILE IMAGE */}
          <div className="my-6">
            <div className="relative w-40 h-40 mx-auto">
              <Image
                src={photoUri || "/murphylogo.png"}
                fill
                alt="Profile"
                className="rounded-full object-cover"
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

          {/* ===== FORM ===== */}
          <div className="space-y-6">

            <ProfileSection title="Personal Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  id="firstName"
                  label="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  error={errors.first_name || ""}
                />
                <Input
                  id="lastName"
                  label="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  error={errors.last_name || ""}
                />
              </div>

              <Input
                id="country"
                label="Country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              />

              {userType !== "international_buddy" && (
                <Input
                  id="village"
                  label="Village"
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                />
              )}

              {/* BIO */}
              <div>
                <p className="text-sm text-gray-500 mb-1">Bio / Challenges</p>
                <button
                  onClick={handleOpenBioModal}
                  className="w-full border-b border-gray-300 p-2 text-left flex justify-between items-center"
                >
                  <span className="truncate">
                    {bio || "Add your bio or challenges..."}
                  </span>
                </button>
              </div>

              <Input
                type="date"
                id="birthday"
                label="Birthday"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
              />
            </ProfileSection>

            <ProfileSection title="Education">
              <Dropdown
                options={educationOptions}
                currentValue={educationLevel}
                valueChange={setEducationLevel}
                text="Education Level"
              />
            </ProfileSection>

            <ProfileSection title="Interest">
              <Input
                id="dreamjob"
                label="Dream job"
                value={dreamJob}
                onChange={(e) => setDreamJob(e.target.value)}
              />
              <Input
                id="hobby"
                label="Hobby"
                value={hobby}
                onChange={(e) => setHobby(e.target.value)}
              />
            </ProfileSection>

            <Input
              id="favoriteColor"
              label="Favorite color"
              value={favoriteColor}
              onChange={(e) => setFavoriteColor(e.target.value)}
            />

            {/* SAVE */}
            <div className="flex justify-center py-4">
              <Button
                btnText={isSaving ? <LoadingSpinner /> : "Save"}
                color="green"
                disabled={isSaving}
                onClick={saveProfileData}
                rounded="rounded-full"
              />
            </div>
          </div>
        </div>

        {/* ===== NAVBAR ===== */}
        <div className="shrink-0 border-t bg-blue-100 rounded-b-2xl">
          <NavBar />
        </div>
      </PageContainer>
    </div>
  </PageBackground>
);

}
