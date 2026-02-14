"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import * as Sentry from "@sentry/nextjs";

import Button from "../../components/general/Button";
import Input from "../../components/general/Input";
import { PageContainer } from "../../components/general/PageContainer";
import { PageBackground } from "../../components/general/PageBackground";
import Dropdown from "../../components/general/Dropdown";
import Dialog from "../../components/general/Dialog";
import { PageHeader } from "../../components/general/PageHeader";
import LoadingSpinner from "../../components/loading/LoadingSpinner";
import NavBar from "../../components/bottom-nav-bar";
import { usePageAnalytics } from "../useAnalytics";
import { logError } from "../utils/analytics";
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

  const [isBioModalOpen, setIsBioModalOpen] = useState(false);
  const [tempBio, setTempBio] = useState("");

  const router = useRouter();
  usePageAnalytics("/profile");

  // Auth listener
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

  // Fetch user profile
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
        setGender(userData.gender || "");
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
        const raw = userData.hobbies || [];
          setHobbies(
            raw.map((h) =>
              typeof h === "string"
                ? { id: h, label: h }
                : h
            )
          );
      } else {
        setHobbies([]);
      }
    };

    fetchUserData();
  }, [user]);

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

          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-500">Profile editing temporarily unavailable.</p>
          </div>
          
          <div className="shrink-0 border-t bg-blue-100 rounded-b-2xl">
            <NavBar />
          </div>
        </PageContainer>
      </div>
    </PageBackground>
  );
}
