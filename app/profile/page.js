"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
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
import { PageContainer } from "../../components/general/PageContainer";
import Dropdown from "../../components/general/Dropdown";
import ProfileSection from "../../components/general/profile/ProfileSection";
import Dialog from "../../components/general/Dialog";
import { PageHeader } from "../../components/general/PageHeader";
import LoadingSpinner from "../../components/loading/LoadingSpinner";
import NavBar from "../../components/bottom-nav-bar";
import { usePageAnalytics } from "../useAnalytics";
import { logButtonEvent, logError } from "../utils/analytics";
import HobbySelect from "../../components/general/HobbySelect";

export default function EditProfile() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [birthday, setBirthday] = useState("");
  const [country, setCountry] = useState("");
  const [village, setVillage] = useState("");
  const [bio, setBio] = useState("");
  const [educationLevel, setEducationLevel] = useState("");

  // use this like a Yes/No string; keep it consistent.
  const [isOrphan, setIsOrphan] = useState("No");

  const [guardian, setGuardian] = useState("");
  const [dreamJob, setDreamJob] = useState("");
  const [gender, setGender] = useState("");
  const [hobby, setHobby] = useState("");
  const [hobbies, setHobbies] = useState([]);

  const [favoriteColor, setFavoriteColor] = useState("");
  const [photoUri, setPhotoUri] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [dialogMessage, setDialogMessage] = useState("");
  const [dialogTitle, setDialogTitle] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [userType, setUserType] = useState("international_buddy");

  // Modal state
  const [isBioModalOpen, setIsBioModalOpen] = useState(false);
  const [tempBio, setTempBio] = useState("");

  const router = useRouter();
  usePageAnalytics("/profile");

  //Source of truth for auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        setUser(null);
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Fetch profile data whenever React `user` changes
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.uid) return;

      const uid = user.uid;
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
        setGender(userData.gender || "");
        setBio(userData.bio || "");
        setEducationLevel(userData.education_level || "");
        setIsOrphan(userData.is_orphan ? "Yes" : "No");
        setGuardian(userData.guardian || "");
        setDreamJob(userData.dream_job || "");
        setHobby(userData.hobby || "");
        setFavoriteColor(userData.favorite_color || "");
        setPhotoUri(userData.photo_uri || "");
        setUserType(userData.user_type || "");

        if (Array.isArray(userData.hobbies)) {
          setHobbies(userData.hobbies.map((id) => ({ id, label: id })));
        } else if (userData.hobby) {
          setHobbies([
            { id: userData.hobby.toLowerCase(), label: userData.hobby },
          ]);
        } else {
          setHobbies([]);
        }
      } else {
        // Doc missing is fine; save will upsert using setDoc(merge)
        setHobbies([]);
      }
    };

    fetchUserData();
  }, [user]);

  // Defensive upsert save
  const saveProfileData = async () => {
    if (!user?.uid) return;

    const uid = user.uid;
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
      is_orphan: String(isOrphan).toLowerCase() === "yes",
      guardian,
      dream_job: dreamJob,
      hobby,
      hobbies: hobbies.map((h) => h.id),
      favorite_color: favoriteColor,
      gender,
    };

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

      setIsSaving(true);

      // Upsert: create if missing, update if exists
      await setDoc(userProfileRef, userProfile, { merge: true });

      setIsSaved(true);
      setIsDialogOpen(true);
      setDialogTitle("Congratulations!");
      setDialogMessage("Profile saved successfully!");
    } catch (error) {
      setIsDialogOpen(true);
      setDialogTitle("Oops!");
      setDialogMessage("Error saving profile.");
      logError(error, { description: "Error saving profile" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenBioModal = () => {
    setTempBio(bio);
    setIsBioModalOpen(true);
  };

  return (
    <PageBackground className="bg-gray-100 h-screen flex flex-col overflow-hidden">
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
        content={
          <div className="space-y-4">
            <textarea
              value={tempBio}
              onChange={(e) => setTempBio(e.target.value)}
              className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none"
              maxLength={200}
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">
                {tempBio.length}/200 characters
              </span>
              <Button
                btnText="Save"
                onClick={() => {
                  setBio(tempBio);
                  setIsBioModalOpen(false);
                }}
              />
            </div>
          </div>
        }
        width="large"
      />

      <div className="flex-1 min-h-0 flex justify-center">
        <PageContainer
          width="compactXS"
          padding="none"
          center={false}
          className="min-h-[100dvh] flex flex-col bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          <PageHeader title="Profile" image={false} showBackButton />

          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 py-6">
            {/* Profile image */}
            <div className="rounded-2xl p-4">
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

            <div className="space-y-6 mt-6">
              {/* Personal Info */}
              <div className="rounded-2xl bg-white p-4">
                <h3 className="text-sm font-semibold text-secondary mb-4">
                  Personal Information:
                </h3>

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

                <div className="mt-6 space-y-6">
                  <Input
                    id="country"
                    label="Country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                  />

                  {/* Gender */}
                  <div className="rounded-2xl bg-white p-4">
                    <h3 className="text-sm font-semibold text-secondary mb-4">
                      Pronouns:
                    </h3>

                    <Dropdown
                      options={[
                        "He/Him",
                        "She/Her",
                        "Other"
                      ]}
                      currentValue={gender}
                      valueChange={setGender}
                      text="Pronouns"
                    />
                  </div>

                  {userType !== "international_buddy" && (
                    <Input
                      id="village"
                      label="Village"
                      value={village}
                      onChange={(e) => setVillage(e.target.value)}
                    />
                  )}

                  <div>
                    <p className="text-sm text-gray-500 mb-1">
                      Bio / Challenges
                    </p>
                    <button
                      type="button"
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
                </div>
              </div>

              {/* Education */}
              <div className="rounded-2xl bg-white p-4">
                <h3 className="text-sm font-semibold text-secondary mb-4">
                  Education:
                </h3>

                <Dropdown
                  options={[
                    "Elementary",
                    "Middle",
                    "High School",
                    "College/University",
                    "No Grade",
                  ]}
                  currentValue={educationLevel}
                  valueChange={setEducationLevel}
                  text="Education Level"
                />
              </div>

              {/* Interests */}
              <div className="rounded-2xl bg-white p-4">
                <h3 className="text-sm font-semibold text-secondary mb-4">
                  Interests:
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    id="dreamjob"
                    label="Dream job"
                    value={dreamJob}
                    onChange={(e) => setDreamJob(e.target.value)}
                  />

                  <Input
                    id="favoriteColor"
                    label="Favorite color"
                    value={favoriteColor}
                    onChange={(e) => setFavoriteColor(e.target.value)}
                  />

                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-500 mb-1">Hobby</p>
                    <HobbySelect
                      value={hobbies}
                      onChange={(arr) => {
                        setHobbies(arr);
                        setHobby(arr[0]?.label || "");
                      }}
                      allowCustom
                      editable
                      placeholder="Select or add hobbies"
                    />
                  </div>
                </div>
              </div>

              {/* Save */}
              <div className="flex justify-center py-4">
                <Button
                  btnText={isSaving ? <LoadingSpinner /> : "Save"}
                  disabled={isSaving}
                  onClick={saveProfileData}
                  rounded="rounded-full"
                />
              </div>
            </div>
          </div>

          <div className="shrink-0 border-t bg-blue-100 rounded-b-2xl">
            <NavBar />
          </div>
        </PageContainer>
      </div>
    </PageBackground>
  );
}
