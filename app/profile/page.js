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

  useEffect(() => {
    const fetchUserData = async () => {
      if (auth.currentUser) {
        const uid = auth.currentUser.uid;
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
        Sentry.captureException("Error saving profile " + error);
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
    <div className="bg-gray-50 min-h-screen">
      <Dialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          if (isSaved) router.push("/letterhome");
        }}
        title={dialogTitle}
        content={dialogMessage}
      ></Dialog>
      <PageContainer maxWidth="lg" padding="p-6 pt-20">
        <PageHeader title="Profile" image={false} heading={false} />
        <div className="max-w-lg mx-auto pl-6 pr-6 pb-6">
          {/* Bio Modal */}
          <Dialog
            isOpen={isBioModalOpen}
            onClose={() => setIsBioModalOpen(false)}
            title="Bio/Challenges"
            content={bioModalContent}
            width="large"
          />
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
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={() => router.push("/edit-profile-user-image")}
                className="px-4 py-2 border border-gray-400 text-green-700 font-normal rounded-full hover:bg-gray-100 transition"
              >
                Edit Photo
              </button>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-6 mb-[120px]">
            {/* Personal Information Section */}
            <ProfileSection title="Personal Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <Input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      label="First name"
                      borderColor="border-gray-300"
                      focusBorderColor="focus:border-green-800"
                      bgColor="bg-transparent"
                      error={errors.first_name ? errors.first_name : ""}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <Input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      label="Last name"
                      borderColor="border-gray-300"
                      focusBorderColor="focus:border-green-800"
                      bgColor="bg-transparent"
                      error={errors.last_name ? errors.last_name : ""}
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <Input
                    type="text"
                    id="country"
                    name="country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    label="Country"
                    placeholder="Ex: Country"
                    borderColor="border-gray-300"
                    focusBorderColor="focus:border-green-800"
                    bgColor="bg-transparent"
                  />
                </div>
              </div>
              {userType !== "international_buddy" && (
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <Input
                      type="text"
                      id="village"
                      name="village"
                      value={village}
                      onChange={(e) => setVillage(e.target.value)}
                      label="Village"
                      placeholder="Ex: Village"
                      borderColor="border-gray-300"
                      focusBorderColor="focus:border-green-800"
                      bgColor="bg-transparent"
                    />
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Bio/Challenges faced</p>
                  <button
                    onClick={handleOpenBioModal}
                    className="w-full font-medium text-gray-900 bg-transparent border-b border-gray-300 p-2 text-left flex justify-between items-center"
                  >
                    <span className="truncate">
                      {bio ? bio : "Add your bio or challenges..."}
                    </span>
                    <svg
                      className="h-5 w-5 text-gray-400 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <Input
                    type="date"
                    id="birthday"
                    name="birthday"
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                    label="Birthday"
                    borderColor="border-gray-300"
                    focusBorderColor="focus:border-green-800"
                    bgColor="bg-transparent"
                  />
                </div>
              </div>
            </ProfileSection>

            {/* Education & Family Section */}
            <ProfileSection
              title={`Education ${
                userType !== "international_buddy" ? "& Family" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Education level</p>
                  <Dropdown
                    options={educationOptions}
                    valueChange={(option) => {
                      setEducationLevel(option);
                    }}
                    currentValue={educationLevel}
                    text="Education Level"
                  />
                </div>
              </div>
              {userType !== "international_buddy" && (
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">Guardian</p>
                    <Dropdown
                      options={guardianOptions}
                      valueChange={(option) => {
                        setGuardian(option);
                      }}
                      currentValue={guardian}
                      text="Guardian"
                    />
                  </div>
                </div>
              )}
              {userType !== "international_buddy" && (
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">Is orphan</p>

                    <Dropdown
                      options={orphanOptions}
                      valueChange={(option) => {
                        setIsOrphan(option);
                      }}
                      currentValue={isOrphan}
                      text="Orphan Status"
                    />
                  </div>
                </div>
              )}
            </ProfileSection>

            {/* Interest Section */}
            <ProfileSection title="Interest">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <Input
                    type="text"
                    id="dreamjob"
                    name="dreamjob"
                    value={dreamJob}
                    onChange={(e) => setDreamJob(e.target.value)}
                    label="Dream job"
                    placeholder="Airplane pilot"
                    borderColor="border-gray-300"
                    focusBorderColor="focus:border-green-800"
                    bgColor="bg-transparent"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <Input
                    type="text"
                    id="hobby"
                    name="hobby"
                    value={hobby}
                    onChange={(e) => setHobby(e.target.value)}
                    label="Hobby"
                    placeholder="Dancing"
                    borderColor="border-gray-300"
                    focusBorderColor="focus:border-green-800"
                    bgColor="bg-transparent"
                  />
                </div>
              </div>
            </ProfileSection>

            {/* Favorite Color */}
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Input
                  type="text"
                  id="favoriteColor"
                  name="favoriteColor"
                  value={favoriteColor}
                  onChange={(e) => setFavoriteColor(e.target.value)}
                  label="Favorite Color"
                  placeholder="Ex: Blue"
                  borderColor="border-gray-300"
                  focusBorderColor="focus:border-green-800"
                  bgColor="bg-transparent"
                />
              </div>
            </div>

            <div className="flex justify-center">
              <Link
                href="/letterhome"
                className="transition-transform hover:scale-105 focus:outline-none"
                onClick={(e) => {
                  e.preventDefault();
                  saveProfileData();
                }}
              >
                <Button
                  btnType="button"
                  btnText={isSaving ? <LoadingSpinner /> : "Save"}
                  color="green"
                  hoverColor="hover:bg-[#48801c]"
                  textColor="text-gray-200"
                  disabled={isSaving}
                  rounded="rounded-full"
                />
              </Link>
            </div>
          </div>
        </div>
      </PageContainer>
      <BottomNavBar />
    </div>
  );
}
