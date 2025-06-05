"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import { FaChevronDown } from "react-icons/fa"; // Font Awesome
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
import Modal from "../../components/general/Modal";
import List from "../../components/general/List";
import { BackButton } from "../../components/general/BackButton";
import { PageContainer } from "../../components/general/PageContainer";
import { PageBackground } from "../../components/general/PageBackground";
import Dropdown from "../../components/general/Dropdown";
import Popover from "../../components/general/Popover";
import ProfileSection from "../../components/general/profile/ProfileSection";
import Dialog from "../../components/general/Modal";

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
      if (!userProfile.first_name.trim()) {
        newErrors.first_name = "First name is required";
      }

      if (!userProfile.last_name.trim()) {
        newErrors.last_name = "Last name is required";
      }

      if (!userProfile.birthday.trim()) {
        newErrors.birthday = "Birthday is required";
      }

      if (!userProfile.country.trim()) {
        newErrors.country = "Country is required";
      }

      if (!userProfile.village.trim()) {
        newErrors.village = "Village is required";
      }

      if (!userProfile.education_level.trim()) {
        newErrors.education_level = "Level is required";
      }

      if (!userProfile.guardian.trim()) {
        newErrors.guardian = "Guardian is required";
      }

      if (!userProfile.dream_job.trim()) {
        newErrors.dream_job = "Job is required";
      }

      if (userProfile.hobby.length === 0) {
        newErrors.hobby = "Hobby is required";
      }

      if (!userProfile.favorite_color.trim()) {
        newErrors.favorite_color = "Color is required";
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        throw new Error("Form validation error(s)");
      }

      try {
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
    <PageBackground>
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
        <BackButton />
        <div className="max-w-lg mx-auto p-6 pt-4">
          {/* Bio Modal */}
          <Modal
            isOpen={isBioModalOpen}
            onClose={() => setIsBioModalOpen(false)}
            title="Bio/Challenges"
            content={bioModalContent}
            width="large"
          />

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
              <div
                className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full curspr-pointer"
                onClick={() => {
                  router.push("/edit-profile-user-image");
                }}
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-6 mb-[120px]">
            {/* Personal Information Section */}
            <ProfileSection title="Personal Information">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-100 rounded-lg">
                  <User className="w-5 h-5 text-600" />
                </div>
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
                <div className="p-2 bg-100 rounded-lg">
                  <User className="w-5 h-5 text-600" />
                </div>
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

              <div className="flex items-center gap-3">
                <div className="p-2 bg-100 rounded-lg">
                  <MapPin className="w-5 h-5 text-600" />
                </div>
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
                    error={errors.country ? errors.country : ""}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-100 rounded-lg">
                  <Home className="w-5 h-5 text-600" />
                </div>
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
                    error={errors.village ? errors.village : ""}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-100 rounded-lg">
                  <FileText className="w-5 h-5 text-600" />
                </div>
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
                <div className="p-2 bg-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-600" />
                </div>
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
                    error={errors.birthday ? errors.birthday : ""}
                  />
                </div>
              </div>
            </ProfileSection>

            {/* Education & Family Section */}
            <ProfileSection title="Education & Family">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-100 rounded-lg">
                  <GraduationCap className="w-5 h-5 text-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Education level</p>
                  <Dropdown
                    options={educationOptions}
                    valueChange={(option) => {
                      setEducationLevel(option);
                    }}
                    currentValue={educationLevel}
                    text="Education Level"
                    error={errors.education_level ? errors.education_level : ""}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-100 rounded-lg">
                  <Users className="w-5 h-5 text-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Guardian</p>
                  <Dropdown
                    options={guardianOptions}
                    valueChange={(option) => {
                      setGuardian(option);
                    }}
                    currentValue={guardian}
                    text="Guardian"
                    error={errors.guardian ? errors.guardian : ""}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-100 rounded-lg">
                  <Heart className="w-5 h-5 text-600" />
                </div>
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
            </ProfileSection>

            {/* Interest Section */}
            <ProfileSection title="Interest">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-100 rounded-lg">
                  <Briefcase className="w-5 h-5 text-600" />
                </div>
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
                    error={errors.dream_job ? errors.dream_job : ""}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-100 rounded-lg">
                  <Square className="w-5 h-5 text-600" />
                </div>
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
                    error={errors.hobby ? errors.hobby : ""}
                  />
                </div>
              </div>
            </ProfileSection>

            {/* Favorite Color */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-100 rounded-lg">
                <Palette className="w-5 h-5 text-600" />
              </div>
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
                  error={errors.favorite_color ? errors.favorite_color : ""}
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
                  btnText={
                    isSaving ? (
                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-gray-400"></div>
                    ) : (
                      "Save"
                    )
                  }
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
    </PageBackground>
  );
}
