"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";

import Button from "../../components/general/Button";
import Input from "../../components/general/Input";
import Dropdown from "../../components/general/Dropdown";
import HobbySelect from "../../components/general/HobbySelect";
import Dialog from "../../components/general/Dialog";
import { PageHeader } from "../../components/general/PageHeader";
import { PageContainer } from "../../components/general/PageContainer";
import { PageBackground } from "../../components/general/PageBackground";
import LoadingSpinner from "../../components/loading/LoadingSpinner";
import NavBar from "../../components/bottom-nav-bar";

import { usePageAnalytics } from "../useAnalytics";
import { logError } from "../utils/analytics";

export default function EditProfile() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [country, setCountry] = useState("");
  const [village, setVillage] = useState("");
  const [bio, setBio] = useState("");
  const [educationLevel, setEducationLevel] = useState("");
  const [isOrphan, setIsOrphan] = useState("No");
  const [guardian, setGuardian] = useState("");
  const [dreamJob, setDreamJob] = useState("");
  const [gender, setGender] = useState("");
  const [hobbies, setHobbies] = useState([]);
  const [favoriteColor, setFavoriteColor] = useState("");
  const [photoUri, setPhotoUri] = useState("");

  const [user, setUser] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogMessage, setDialogMessage] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  // Unsaved changes guard
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const pendingNavRef = useRef(null);

  // Bio modal
  const [isBioModalOpen, setIsBioModalOpen] = useState(false);
  const [tempBio, setTempBio] = useState("");

  const router = useRouter();
  usePageAnalytics("/profile");

  // Auth source of truth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/login");
      } else {
        setUser(currentUser);
      }
    });
    return () => unsub();
  }, [router]);

  // Fetch profile
  useEffect(() => {
    if (!user?.uid) return;

    const fetchProfile = async () => {
      const snap = await getDoc(doc(db, "users", user.uid));
      if (!snap.exists()) return;

      const d = snap.data();
      setFirstName(d.first_name || "");
      setLastName(d.last_name || "");
      setBirthday(d.birthday || "");
      setCountry(d.country || "");
      setVillage(d.village || "");
      setBio(d.bio || "");
      setEducationLevel(d.education_level || "");
      setIsOrphan(d.is_orphan ? "Yes" : "No");
      setGuardian(d.guardian || "");
      setDreamJob(d.dream_job || "");
      setGender(d.gender || "");
      setFavoriteColor(d.favorite_color || "");
      setPhotoUri(d.photo_uri || "");
      setHobbies(Array.isArray(d.hobbies) ? d.hobbies.map(h => ({ id: h, label: h })) : []);
    };

    fetchProfile();
  }, [user]);

  // Browser close / refresh guard
  useEffect(() => {
    const handler = (e) => {
      if (!hasUnsavedChanges) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsavedChanges]);

  const attemptNavigate = (fn) => {
    if (!hasUnsavedChanges) {
      fn();
      return;
    }
    pendingNavRef.current = fn;
    setShowLeaveDialog(true);
  };

  const saveProfileData = async () => {
    if (!user?.uid) return;

    const ref = doc(db, "users", user.uid);
    const payload = {
      first_name: firstName,
      last_name: lastName,
      birthday,
      country,
      village,
      bio,
      education_level: educationLevel,
      is_orphan: isOrphan === "Yes",
      guardian,
      dream_job: dreamJob,
      gender,
      hobbies: hobbies.map(h => h.id),
      favorite_color: favoriteColor,
    };

    try {
      setIsSaving(true);
      await setDoc(ref, payload, { merge: true });
      setHasUnsavedChanges(false);
      setIsSaved(true);
      setDialogTitle("Congratulations!");
      setDialogMessage("Profile saved successfully!");
      setIsDialogOpen(true);
    } catch (e) {
      setDialogTitle("Oops!");
      setDialogMessage("Error saving profile.");
      setIsDialogOpen(true);
      logError(e);
    } finally {
      setIsSaving(false);
    }
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
        isOpen={showLeaveDialog}
        variant="confirmation"
        title="Unsaved changes"
        content="You have unsaved changes. Are you sure you want to leave?"
        buttons={[
          { text: "Cancel", onClick: () => setShowLeaveDialog(false) },
          {
            text: "Leave",
            onClick: () => {
              setShowLeaveDialog(false);
              pendingNavRef.current?.();
            },
          },
        ]}
      />

      <PageContainer className="flex-1 flex flex-col bg-white">
        <PageHeader
          title="Profile"
          image={false}
          onBack={() => attemptNavigate(() => router.push("/letterhome"))}
        />

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          <div className="relative w-40 h-40 mx-auto">
            <Image
              src={photoUri || "/murphylogo.png"}
              fill
              className="rounded-full object-cover"
              alt="Profile"
            />
          </div>
