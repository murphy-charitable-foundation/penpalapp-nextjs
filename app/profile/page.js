"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, deleteObject } from "firebase/firestore";
import { ref } from "firebase/storage";
import { db, auth, storage } from "../firebaseConfig";
import Button from "../../components/general/Button";
import Input from "../../components/general/Input";
import { PageContainer } from "../../components/general/PageContainer";
import Dropdown from "../../components/general/Dropdown";
import ProfileSection from "../../components/general/profile/ProfileSection";
import Dialog from "../../components/general/Dialog";
import { PageHeader } from "../../components/general/PageHeader";
import LoadingSpinner from "../../components/loading/LoadingSpinner";
import NavBar from "../../components/bottom-nav-bar";
import { usePageAnalytics } from "../useAnalytics";
import { logButtonEvent, logError } from "../utils/analytics";
import {
  saveAvatar,
  confirmDeleteAvatar,
} from "@/components/avatar/avatarUtils";
import AvatarCropper from "@/components/avatar/AvatarCropper";
import AvatarMenu from "@/components/avatar/AvatarMenu";
import HobbySelect from "../../components/general/HobbySelect";

/* ❗ If you add new fields to the user profile, update this file as well as the view profile page, pages/createChild API, and user-data-import page */

const EDUCATION_OPTIONS = [
  "Elementary",
  "Middle",
  "High School",
  "College/University",
  "No Grade",
];
const GUARDIAN_OPTIONS = [
  "Parents",
  "Adoptive Parents",
  "Aunt/Uncle",
  "Grandparents",
  "Other Family",
  "Friends",
  "Other",
];
const ORPHAN_OPTIONS = ["Yes", "No"];
const PRONOUNS_OPTIONS = ["He/Him", "She/Her", "Other"];

export default function EditProfile() {
  const [showMenu, setShowMenu] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const [mode, setMode] = useState(null);
  const avatarRef = useRef();
  const [loading, setLoading] = useState(false);

  // Form state
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    birthday: "",
    country: "",
    village: "",
    bio: "",
    educationLevel: "",
    isOrphan: "No",
    guardian: "",
    dreamJob: "",
    hobby: "",
    favoriteColor: "",
    favoriteAnimal: "",
    profession: "",
    pronouns: "",
  });
  const [hobbies, setHobbies] = useState([]);
  const [userType, setUserType] = useState("international_buddy");

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [errors, setErrors] = useState({});
  const [user, setUser] = useState(null);
  const [dialog, setDialog] = useState({ open: false, title: "", message: "" });
  const [bioModal, setBioModal] = useState({ open: false, temp: "" });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmInfo, setConfirmInfo] = useState("");

  const router = useRouter();
  usePageAnalytics("/profile");

  const setField = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e?.target ? e.target.value : e }));

  // Auth guard
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) setUser(currentUser);
      else {
        setUser(null);
        router.push("/login");
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Fetch profile data
  useEffect(() => {
    if (!user?.uid) return;
    const fetchUserData = async () => {
      const docSnap = await getDoc(doc(db, "users", user.uid));
      if (!docSnap.exists()) {
        setHobbies([]);
        return;
      }
      const d = docSnap.data();
      setForm({
        firstName: d.first_name || "",
        lastName: d.last_name || "",
        email: d.email || "",
        birthday: d.birthday || "",
        country: d.country || "",
        village: d.village || "",
        bio: d.bio || "",
        educationLevel: d.education_level || "",
        isOrphan: d.is_orphan ? "Yes" : "No",
        guardian: d.guardian || "",
        dreamJob: d.dream_job || "",
        hobby: d.hobby || "",
        favoriteColor: d.favorite_color || "",
        favoriteAnimal: d.favorite_animal || "",
        profession: d.profession || "",
        pronouns: d.pronouns || "",
      });
      setUserType(d.user_type || "international_buddy");
      setAvatar(d.photo_uri || null);
      if (Array.isArray(d.hobbies)) {
        setHobbies(d.hobbies.map((id) => ({ id, label: id })));
      } else if (d.hobby) {
        setHobbies([{ id: d.hobby.toLowerCase(), label: d.hobby }]);
      } else {
        setHobbies([]);
      }
    };
    fetchUserData();
  }, [user]);

  const saveProfileData = async () => {
    if (!user?.uid) return;
    const newErrors = {};
    if (!form.firstName.trim() && !form.lastName.trim()) {
      newErrors.first_name = "Name is required";
      newErrors.last_name = "Name is required";
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setDialog({
        open: true,
        title: "Oops!",
        message: "Error saving profile.",
      });
      return;
    }
    try {
      setIsSaving(true);
      await setDoc(
        doc(db, "users", user.uid),
        {
          first_name: form.firstName,
          last_name: form.lastName,
          email: form.email,
          birthday: form.birthday,
          country: form.country,
          village: form.village,
          bio: form.bio,
          education_level: form.educationLevel,
          is_orphan: form.isOrphan.toLowerCase() === "yes",
          guardian: form.guardian,
          dream_job: form.dreamJob,
          hobby: form.hobby,
          hobbies: hobbies.map((h) => h.id),
          favorite_color: form.favoriteColor,
          favorite_animal: form.favoriteAnimal,
          profession: form.profession,
          pronouns: form.pronouns,
        },
        { merge: true },
      );
      setIsSaved(true);
      setDialog({
        open: true,
        title: "Congratulations!",
        message: "Profile saved successfully!",
      });
    } catch (error) {
      setDialog({
        open: true,
        title: "Oops!",
        message: "Error saving profile.",
      });
      logError(error, { description: "Error saving profile" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAvatar = async (inputAvatar) => {
    await saveAvatar({
      avatar: inputAvatar,
      setLoading,
      onSuccess: () => console.log("Avatar saved!"),
      onError: (error) => console.error("Avatar error:", error),
    });
  };

  const handleConfirm = async () => {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      await Promise.allSettled([
        deleteObject(ref(storage, `profile/${uid}/profile-image`)),
        setDoc(doc(db, "users", uid), { photo_uri: null }, { merge: true }),
      ]);
      setAvatar(null);
    } catch (e) {
      console.error("Failed to delete avatar:", e);
    } finally {
      setConfirmOpen(false);
      setShowMenu(false);
    }
  };

  const isChildOrVolunteer =
    userType === "child" || userType === "local_volunteer";
  const isInternationalBuddy = userType === "international_buddy";

  if (loading) return <LoadingSpinner />;

  return (
    <div className="bg-gray-50 flex flex-col" style={{ height: "100dvh" }}>
      {/* Dialogs */}
      <Dialog
        isOpen={dialog.open}
        onClose={() => {
          setDialog((d) => ({ ...d, open: false }));
          if (isSaved) router.push("/letterhome");
        }}
        title={dialog.title}
        content={dialog.message}
      />
      <Dialog
        isOpen={bioModal.open}
        onClose={() => setBioModal((b) => ({ ...b, open: false }))}
        title="Bio/Challenges"
        width="large"
        content={
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Share your challenges or a brief bio:
            </p>
            <textarea
              value={bioModal.temp}
              onChange={(e) =>
                setBioModal((b) => ({ ...b, temp: e.target.value }))
              }
              className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-green-500"
              placeholder="Write about yourself or challenges you've faced..."
              maxLength={200}
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">
                {bioModal.temp.length}/200 characters
              </span>
              <Button
                btnText="Save"
                color="bg-green-800"
                onClick={() => {
                  setForm((f) => ({ ...f, bio: bioModal.temp }));
                  setBioModal((b) => ({ ...b, open: false }));
                }}
              />
            </div>
          </div>
        }
      />
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

      <div className="shrink-0">
        <PageHeader title="Profile" image={false} heading={false} />
      </div>

      <div
        className="flex-1 min-h-0 overflow-y-auto"
        style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-y" }}
      >
        <PageContainer maxWidth="lg" padding="px-6 py-6">
          <div className="max-w-lg mx-auto space-y-6 pb-6">
            {/* Avatar */}
            <div className="flex justify-center">
              <div
                className="w-40 h-40 rounded-full bg-[#4E802A] flex items-center justify-center relative cursor-pointer"
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

            {/* Personal Information */}
            <ProfileSection title="Personal Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  id="firstName"
                  label="First name"
                  type="text"
                  value={form.firstName}
                  onChange={setField("firstName")}
                  borderColor="border-gray-300"
                  focusBorderColor="focus:border-green-800"
                  bgColor="bg-transparent"
                  error={errors.first_name || ""}
                />
                <Input
                  id="lastName"
                  label="Last name"
                  type="text"
                  value={form.lastName}
                  onChange={setField("lastName")}
                  borderColor="border-gray-300"
                  focusBorderColor="focus:border-green-800"
                  bgColor="bg-transparent"
                  error={errors.last_name || ""}
                />
              </div>
              <Input
                id="country"
                label="Country"
                type="text"
                value={form.country}
                onChange={setField("country")}
                placeholder="Ex: Country"
                borderColor="border-gray-300"
                focusBorderColor="focus:border-green-800"
                bgColor="bg-transparent"
              />
              <div>
                <p className="text-sm text-gray-500">Pronouns</p>
                <Dropdown
                  options={PRONOUNS_OPTIONS}
                  currentValue={form.pronouns}
                  valueChange={setField("pronouns")}
                  text="Pronouns"
                />
              </div>
              {isChildOrVolunteer && (
                <Input
                  id="village"
                  label="Village"
                  type="text"
                  value={form.village}
                  onChange={setField("village")}
                  placeholder="Ex: Village"
                  borderColor="border-gray-300"
                  focusBorderColor="focus:border-green-800"
                  bgColor="bg-transparent"
                />
              )}
              <div>
                <p className="text-sm text-gray-500">Bio/Challenges faced</p>
                <button
                  onClick={() => setBioModal({ open: true, temp: form.bio })}
                  className="w-full font-medium text-gray-900 bg-transparent border-b border-gray-300 p-2 text-left flex justify-between items-center"
                >
                  <span className="truncate">
                    {form.bio || "Add your bio or challenges..."}
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
                id="birthday"
                label="Birthday"
                type="date"
                value={form.birthday}
                onChange={setField("birthday")}
                borderColor="border-gray-300"
                focusBorderColor="focus:border-green-800"
                bgColor="bg-transparent"
              />
            </ProfileSection>

            {userType !== "admin" && (
              <>
                {/* Education & Family */}
                <ProfileSection
                  title={`Education${isChildOrVolunteer ? " & Family" : ""}`}
                >
                  <div>
                    <p className="text-sm text-gray-500">Education level</p>
                    <Dropdown
                      options={EDUCATION_OPTIONS}
                      currentValue={form.educationLevel}
                      valueChange={setField("educationLevel")}
                      text="Education Level"
                    />
                  </div>
                  {isChildOrVolunteer && (
                    <>
                      <div>
                        <p className="text-sm text-gray-500">Guardian</p>
                        <Dropdown
                          options={GUARDIAN_OPTIONS}
                          currentValue={form.guardian}
                          valueChange={setField("guardian")}
                          text="Guardian"
                        />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Is orphan</p>
                        <Dropdown
                          options={ORPHAN_OPTIONS}
                          currentValue={form.isOrphan}
                          valueChange={setField("isOrphan")}
                          text="Orphan Status"
                        />
                      </div>
                    </>
                  )}
                </ProfileSection>

                {/* Interests */}
                <ProfileSection title="Interests">
                  {isInternationalBuddy && (
                    <>
                      <Input
                        id="profession"
                        label="Profession"
                        type="text"
                        value={form.profession}
                        onChange={setField("profession")}
                        borderColor="border-gray-300"
                        focusBorderColor="focus:border-green-800"
                        bgColor="bg-transparent"
                      />
                      <Input
                        id="favoriteAnimal"
                        label="Favorite animal"
                        type="text"
                        value={form.favoriteAnimal}
                        onChange={setField("favoriteAnimal")}
                        borderColor="border-gray-300"
                        focusBorderColor="focus:border-green-800"
                        bgColor="bg-transparent"
                      />
                    </>
                  )}
                  {isChildOrVolunteer && (
                    <>
                      <Input
                        id="dreamjob"
                        label="Dream job"
                        type="text"
                        value={form.dreamJob}
                        onChange={setField("dreamJob")}
                        placeholder="Airplane pilot"
                        borderColor="border-gray-300"
                        focusBorderColor="focus:border-green-800"
                        bgColor="bg-transparent"
                      />
                      <Input
                        id="favoriteColor"
                        label="Favorite color"
                        type="text"
                        value={form.favoriteColor}
                        onChange={setField("favoriteColor")}
                        placeholder="Ex: Blue"
                        borderColor="border-gray-300"
                        focusBorderColor="focus:border-green-800"
                        bgColor="bg-transparent"
                      />
                      <Input
                        id="favoriteAnimal2"
                        label="Favorite animal"
                        type="text"
                        value={form.favoriteAnimal}
                        onChange={setField("favoriteAnimal")}
                        borderColor="border-gray-300"
                        focusBorderColor="focus:border-green-800"
                        bgColor="bg-transparent"
                      />
                    </>
                  )}
                  <div>
                    <p className="text-sm text-gray-500">Hobby</p>
                    <HobbySelect
                      value={hobbies}
                      onChange={(arr) => {
                        setHobbies(arr);
                        setForm((f) => ({ ...f, hobby: arr[0]?.label || "" }));
                      }}
                      allowCustom
                      editable
                      placeholder="Select or add hobbies"
                    />
                  </div>
                </ProfileSection>
              </>
            )}

            {/* Save button */}
            <div className="flex justify-center pb-4">
              <Button
                btnText={isSaving ? <LoadingSpinner /> : "Save"}
                disabled={isSaving}
                onClick={() => {
                  saveProfileData();
                  logButtonEvent("save profile button clicked", "/profile");
                }}
                rounded="rounded-full"
              />
            </div>
          </div>
        </PageContainer>
      </div>

      <div className="shrink-0 border-t bg-white">
        <NavBar />
      </div>
      <AvatarMenu
        show={showMenu}
        onClose={() => setShowMenu(false)}
        onCamera={() => {
          setMode("camera");
          setTimeout(() => avatarRef.current?.pickPicture(), 50);
        }}
        onGallery={() => {
          setMode("gallery");
          setTimeout(() => avatarRef.current?.pickPicture(), 50);
        }}
        onDelete={() => confirmDeleteAvatar({ setConfirmOpen, setConfirmInfo })}
        avatar={avatar}
      />
      {mode && (
        <AvatarCropper
          type={mode}
          ref={avatarRef}
          onComplete={(cropped) => {
            handleSaveAvatar(cropped);
            setAvatar(cropped);
            setMode(null);
            setShowMenu(false);
          }}
        />
      )}
    </div>
  );
}
