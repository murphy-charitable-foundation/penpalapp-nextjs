"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import * as Sentry from "@sentry/nextjs";

import Button from "../../components/general/Button";
import Input from "../../components/general/Input";
import Dropdown from "../../components/general/Dropdown";
import ProfileSection from "../../components/general/profile/ProfileSection";
import Dialog from "../../components/general/Dialog";
import { PageContainer } from "../../components/general/PageContainer";
import { PageHeader } from "../../components/general/PageHeader";
import LoadingSpinner from "../../components/loading/LoadingSpinner";
import { usePageAnalytics } from "../useAnalytics";
import { logButtonEvent, logError } from "../utils/analytics";
import BottomNavBar from "../../components/bottom-nav-bar";

export default function EditProfile() {
  const router = useRouter();
  usePageAnalytics("/profile");

  // ---------------- STATE ----------------
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
  const [photoUri, setPhotoUri] = useState("");
  const [userType, setUserType] = useState("international_buddy");

  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogMessage, setDialogMessage] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  // Bio modal
  const [isBioModalOpen, setIsBioModalOpen] = useState(false);
  const [tempBio, setTempBio] = useState("");

  // ---------------- FETCH USER ----------------
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }

      try {
        const snap = await getDoc(doc(db, "users", currentUser.uid));
        if (!snap.exists()) return;

        const d = snap.data();
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
        setPhotoUri(d.photo_uri || "");
        setUserType(d.user_type || "international_buddy");
      } catch (err) {
        Sentry.captureException(err);
      }
    });

    return () => unsub();
  }, [router]);

  // ---------------- SAVE ----------------
  const saveProfileData = async () => {
    if (!auth.currentUser) return;

    setIsSaving(true);
    setErrors({});

    const payload = {
      first_name: firstName,
      last_name: lastName,
      email,
      birthday,
      country,
      village,
      bio,
      education_level: educationLevel,
      is_orphan: isOrphan === "Yes",
      guardian,
      dream_job: dreamJob,
      hobby,
      favorite_color: favoriteColor,
    };

    const errs = {};
    if (!firstName.trim() && !lastName.trim()) {
      errs.first_name = "Name required";
      errs.last_name = "Name required";
    }

    if (Object.keys(errs).length) {
      setErrors(errs);
      setIsSaving(false);
      return;
    }

    try {
      await updateDoc(doc(db, "users", auth.currentUser.uid), payload);
      logButtonEvent("profile_saved", "/profile");
      setIsSaved(true);
      setDialogTitle("Success");
      setDialogMessage("Profile saved successfully!");
      setIsDialogOpen(true);
    } catch (err) {
      logError(err, { location: "EditProfile save" });
      setDialogTitle("Error");
      setDialogMessage("Failed to save profile.");
      setIsDialogOpen(true);
    } finally {
      setIsSaving(false);
    }
  };

  // ---------------- CONSTANTS ----------------
  const NAV_BAR_H = 88;
  const TOP_GAP = 8;

  // ---------------- RENDER ----------------
  return (
    <div className="bg-gray-100 min-h-[103dvh] flex flex-col">
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
              maxLength={200}
              className="w-full h-32 p-3 border rounded-lg"
            />
            <Button
              btnText="Save"
              color="green"
              textColor="text-white"
              onClick={() => {
                setBio(tempBio);
                setIsBioModalOpen(false);
              }}
            />
          </div>
        }
        width="large"
      />

      <div className="flex-1" style={{ paddingTop: TOP_GAP }}>
        <div
          className="mx-auto w-full max-w-[29rem] bg-white rounded-2xl shadow-lg overflow-hidden"
          style={{
            height: `calc(103dvh - ${TOP_GAP}px - ${NAV_BAR_H}px)`,
          }}
        >
          <PageContainer padding="none" scroll={false} className="h-full">
            <div className="h-full overflow-y-auto px-6 py-4">
              <PageHeader title="Profile" image={false} />

              {/* PROFILE IMAGE */}
              <div className="my-6 text-center">
                <div className="relative w-40 h-40 mx-auto">
                  <Image
                    src={photoUri || "/murphylogo.png"}
                    fill
                    className="rounded-full object-cover"
                    alt="Profile"
                  />
                </div>
                <button
                  onClick={() => router.push("/edit-profile-user-image")}
                  className="mt-4 px-4 py-2 border rounded-full text-green-700"
                >
                  Edit Photo
                </button>
              </div>

              {/* FORM */}
              <ProfileSection title="Personal Information">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="First name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    error={errors.first_name}
                  />
                  <Input
                    label="Last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    error={errors.last_name}
                  />
                </div>

                <Input
                  label="Country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                />

                {userType !== "international_buddy" && (
                  <Input
                    label="Village"
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                  />
                )}

                <button
                  onClick={() => {
                    setTempBio(bio);
                    setIsBioModalOpen(true);
                  }}
                  className="w-full border-b py-2 text-left"
                >
                  {bio || "Add bio / challenges…"}
                </button>

                <Input
                  type="date"
                  label="Birthday"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                />
              </ProfileSection>

              <ProfileSection title="Education & Family">
                <Dropdown
                  text="Education Level"
                  options={[
                    "Elementary",
                    "Middle",
                    "High School",
                    "College/University",
                    "No Grade",
                  ]}
                  currentValue={educationLevel}
                  valueChange={setEducationLevel}
                />

                {userType !== "international_buddy" && (
                  <>
                    <Dropdown
                      text="Guardian"
                      options={[
                        "Parents",
                        "Adoptive Parents",
                        "Aunt/Uncle",
                        "Grandparents",
                        "Other",
                      ]}
                      currentValue={guardian}
                      valueChange={setGuardian}
                    />
                    <Dropdown
                      text="Orphan Status"
                      options={["Yes", "No"]}
                      currentValue={isOrphan}
                      valueChange={setIsOrphan}
                    />
                  </>
                )}
              </ProfileSection>

              <ProfileSection title="Interests">
                <Input
                  label="Dream job"
                  value={dreamJob}
                  onChange={(e) => setDreamJob(e.target.value)}
                />
                <Input
                  label="Hobby"
                  value={hobby}
                  onChange={(e) => setHobby(e.target.value)}
                />
              </ProfileSection>

              <Input
                label="Favorite color"
                value={favoriteColor}
                onChange={(e) => setFavoriteColor(e.target.value)}
              />

              <div className="flex justify-center my-6">
                <Button
                  btnText={isSaving ? <LoadingSpinner /> : "Save"}
                  color="green"
                  rounded="rounded-full"
                  disabled={isSaving}
                  onClick={saveProfileData}
                />
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
