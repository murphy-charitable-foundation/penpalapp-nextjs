"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { db, auth, storage } from "../firebaseConfig";
import Button from "../../components/general/Button";
import Input from "../../components/general/Input";
import { PageContainer } from "../../components/general/PageContainer";
import Dropdown from "../../components/general/Dropdown";
import ProfileSection from "../../components/general/profile/ProfileSection";
import Dialog from "../../components/general/Dialog";
import { PageHeader } from "../../components/general/PageHeader";
import LoadingSpinner from "../../components/loading/LoadingSpinner";
import { usePageAnalytics } from "../useAnalytics";
import { logButtonEvent, logError } from "../utils/analytics";
import {
  saveAvatar,
  confirmDeleteAvatar,
} from "@/components/avatar/avatarUtils";
import AvatarCropper from "@/components/avatar/AvatarCropper";
import AvatarMenu from "@/components/avatar/AvatarMenu";

export default function EditProfile() {
  const [showMenu, setShowMenu] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const [mode, setMode] = useState(null); // 'camera' | 'gallery'
  const avatarRef = useRef();
  const [loading, setLoading] = useState(false);

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [birthday, setBirthday] = useState("");
  const [country, setCountry] = useState("");
  const [village, setVillage] = useState("");
  const [bio, setBio] = useState("");
  const [educationLevel, setEducationLevel] = useState("");
  const [isOrphan, setIsOrphan] = useState("No");
  const [guardian, setGuardian] = useState("");
  const [dreamJob, setDreamJob] = useState("");
  const [hobby, setHobby] = useState("");
  const [favoriteColor, setFavoriteColor] = useState("");
  const [userType, setUserType] = useState("");

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [errors, setErrors] = useState({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const [dialogTitle, setDialogTitle] = useState("");
  const [isBioModalOpen, setIsBioModalOpen] = useState(false);
  const [tempBio, setTempBio] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmInfo, setConfirmInfo] = useState("");

  const router = useRouter();
  usePageAnalytics("/profile");

  // Fetch user data on mount
  useEffect(() => {
    const fetchUserData = async () => {
      if (!auth.currentUser) return;
      const docSnap = await getDoc(doc(db, "users", auth.currentUser.uid));
      if (!docSnap.exists()) return;
      const d = docSnap.data();
      setFirstName(d.first_name || "");
      setLastName(d.last_name || "");
      setEmail(d.email || "");
      setBirthday(d.birthday || "");
      setCountry(d.country || "");
      setVillage(d.village || "");
      setBio(d.bio || "");
      setEducationLevel(d.education_level || "");
      setIsOrphan(d.is_orphan ? "Yes" : "No");
      setGuardian(d.guardian || "");
      setDreamJob(d.dream_job || "");
      setHobby(d.hobby || "");
      setFavoriteColor(d.favorite_color || "");
      setUserType(d.user_type || "");
      setAvatar(d.photo_uri || null);
    };
    fetchUserData();
  }, [auth.currentUser]);

  // Auth guard
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) router.push("/login");
    });
    return () => unsubscribe();
  }, [router]);

  const saveProfileData = async () => {
    if (!auth.currentUser) return;
    const newErrors = {};
    if (!firstName.trim() && !lastName.trim()) {
      newErrors.first_name = "Name is required";
      newErrors.last_name = "Name is required";
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsDialogOpen(true);
      setDialogTitle("Oops!");
      setDialogMessage("Error saving profile.");
      return;
    }
    try {
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        first_name: firstName,
        last_name: lastName,
        email,
        birthday,
        country,
        village,
        bio,
        education_level: educationLevel,
        is_orphan: isOrphan.toLowerCase() === "yes",
        guardian,
        dream_job: dreamJob,
        hobby,
        favorite_color: favoriteColor,
      });
      setIsSaved(true);
      setIsDialogOpen(true);
      setDialogTitle("Congratulations!");
      setDialogMessage("Profile saved successfully!");
    } catch (error) {
      setIsDialogOpen(true);
      setDialogTitle("Oops!");
      setDialogMessage("Error saving profile.");
      logError(error, { description: "Error saving profile" });
    }
  };

  const handleOpenBioModal = () => {
    setTempBio(bio);
    setIsBioModalOpen(true);
  };

  const handleSaveAvatar = async (inputAvatar) => {
    await saveAvatar({
      avatar: inputAvatar,
      setLoading,
      onSuccess: () => console.log("Avatar saved!"),
      onError: (error) => console.error("Avatar error:", error),
    });
  };

  const onImageDelete = () => {
    confirmDeleteAvatar({ setConfirmOpen, setConfirmInfo });
  };

  const handleConfirm = async () => {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      await Promise.allSettled([
        deleteObject(ref(storage, `profile/${uid}/profile-image`)),
        updateDoc(doc(db, "users", uid), { photo_uri: null }),
      ]);
      setAvatar(null);
    } catch (e) {
      console.error("Failed to delete avatar:", e);
    } finally {
      setConfirmOpen(false);
      setShowMenu(false);
    }
  };

  const handleGetAvatar = (type) => {
    setMode(type);
    setTimeout(() => avatarRef.current?.pickPicture(), 50);
  };

  const isInternationalBuddy = userType === "international_buddy";

  const educationOptions = [
    "Elementary",
    "Middle",
    "High School",
    "College/University",
    "No Grade",
  ];
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

  const bioModalContent = (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
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

  if (loading) return <LoadingSpinner />;

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Result dialog */}
      <Dialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          if (isSaved) router.push("/letterhome");
        }}
        title={dialogTitle}
        content={dialogMessage}
      />

      {/* Bio modal */}
      <Dialog
        isOpen={isBioModalOpen}
        onClose={() => setIsBioModalOpen(false)}
        title="Bio/Challenges"
        content={bioModalContent}
        width="large"
      />

      {/* Delete avatar confirm dialog */}
      <Dialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Confirm"
        width="default"
        closeOnOverlay={false}
        content={
          <div>
            <p className="mb-4">{confirmInfo}</p>
            <div className="flex justify-center gap-4">
              <Button
                btnText="Cancel"
                color="gray"
                onClick={() => setConfirmOpen(false)}
              />
              <Button btnText="Confirm" color="red" onClick={handleConfirm} />
            </div>
          </div>
        }
      />

      <PageContainer maxWidth="lg" padding="p-6 pt-20">
        <PageHeader title="Profile" image={false} heading={false} />

        <div className="max-w-lg mx-auto px-6 pb-6">
          {/* Avatar */}
          <div className="flex justify-center mb-6">
            <div
              className="w-48 h-48 rounded-full bg-[#4E802A] flex items-center justify-center relative cursor-pointer"
              onClick={() => setShowMenu(true)}
            >
              {!avatar ? (
                <Image
                  src="/blackcameraicon.svg"
                  alt="camera"
                  width={35}
                  height={35}
                />
              ) : (
                <>
                  <Image
                    src={avatar}
                    alt="avatar"
                    width={300}
                    height={300}
                    className="object-cover rounded-full"
                  />
                  <div className="w-10 h-10 rounded-full bg-blue-900 absolute bottom-1 right-2 text-white flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="size-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125"
                      />
                    </svg>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Form */}
          <div className="space-y-6 mb-[120px]">
            {/* Personal Information */}
            <ProfileSection title="Personal Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  type="text"
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  label="First name"
                  borderColor="border-gray-300"
                  focusBorderColor="focus:border-green-800"
                  bgColor="bg-transparent"
                  error={errors.first_name || ""}
                />
                <Input
                  type="text"
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  label="Last name"
                  borderColor="border-gray-300"
                  focusBorderColor="focus:border-green-800"
                  bgColor="bg-transparent"
                  error={errors.last_name || ""}
                />
              </div>

              <Input
                type="text"
                id="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                label="Country"
                placeholder="Ex: Country"
                borderColor="border-gray-300"
                focusBorderColor="focus:border-green-800"
                bgColor="bg-transparent"
              />

              {!isInternationalBuddy && (
                <Input
                  type="text"
                  id="village"
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  label="Village"
                  placeholder="Ex: Village"
                  borderColor="border-gray-300"
                  focusBorderColor="focus:border-green-800"
                  bgColor="bg-transparent"
                />
              )}

              {/* Bio */}
              <div>
                <p className="text-sm text-gray-500">Bio/Challenges faced</p>
                <button
                  onClick={handleOpenBioModal}
                  className="w-full font-medium text-gray-900 bg-transparent border-b border-gray-300 p-2 text-left flex justify-between items-center"
                >
                  <span className="truncate">
                    {bio || "Add your bio or challenges..."}
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

              <Input
                type="date"
                id="birthday"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                label="Birthday"
                borderColor="border-gray-300"
                focusBorderColor="focus:border-green-800"
                bgColor="bg-transparent"
              />
            </ProfileSection>

            {/* Education & Family */}
            <ProfileSection
              title={`Education${!isInternationalBuddy ? " & Family" : ""}`}
            >
              <div>
                <p className="text-sm text-gray-500">Education level</p>
                <Dropdown
                  options={educationOptions}
                  valueChange={setEducationLevel}
                  currentValue={educationLevel}
                  text="Education Level"
                />
              </div>

              {!isInternationalBuddy && (
                <>
                  <div>
                    <p className="text-sm text-gray-500">Guardian</p>
                    <Dropdown
                      options={guardianOptions}
                      valueChange={setGuardian}
                      currentValue={guardian}
                      text="Guardian"
                    />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Is orphan</p>
                    <Dropdown
                      options={orphanOptions}
                      valueChange={setIsOrphan}
                      currentValue={isOrphan}
                      text="Orphan Status"
                    />
                  </div>
                </>
              )}
            </ProfileSection>

            {/* Interests */}
            <ProfileSection title="Interest">
              <Input
                type="text"
                id="dreamjob"
                value={dreamJob}
                onChange={(e) => setDreamJob(e.target.value)}
                label="Dream job"
                placeholder="Airplane pilot"
                borderColor="border-gray-300"
                focusBorderColor="focus:border-green-800"
                bgColor="bg-transparent"
              />
              <Input
                type="text"
                id="hobby"
                value={hobby}
                onChange={(e) => setHobby(e.target.value)}
                label="Hobby"
                placeholder="Dancing"
                borderColor="border-gray-300"
                focusBorderColor="focus:border-green-800"
                bgColor="bg-transparent"
              />
            </ProfileSection>

            {/* Favorite Color */}
            <Input
              type="text"
              id="favoriteColor"
              value={favoriteColor}
              onChange={(e) => setFavoriteColor(e.target.value)}
              label="Favorite Color"
              placeholder="Ex: Blue"
              borderColor="border-gray-300"
              focusBorderColor="focus:border-green-800"
              bgColor="bg-transparent"
            />

            {/* Save button */}
            <div className="flex justify-center">
              <Link
                href="/letterhome"
                className="transition-transform hover:scale-105 focus:outline-none"
                onClick={(e) => {
                  e.preventDefault();
                  saveProfileData();
                  logButtonEvent("save profile button clicked", "/profile");
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

      {/* Avatar components */}
      <AvatarMenu
        show={showMenu}
        onClose={() => setShowMenu(false)}
        onCamera={() => handleGetAvatar("camera")}
        onGallery={() => handleGetAvatar("gallery")}
        onDelete={onImageDelete}
        avatar={avatar}
      />

      {mode && (
        <AvatarCropper
          type={mode}
          ref={avatarRef}
          onComplete={(croppedImage) => {
            handleSaveAvatar(croppedImage);
            setAvatar(croppedImage);
            setMode(null);
            setShowMenu(false);
          }}
        />
      )}
    </div>
  );
}
