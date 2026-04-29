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

/* ❗ If you add new fields to the user profile, update this file as well as the view profile page, pages/createChild API, and user-data-import page */

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
  const [userType, setUserType] = useState("");

  const [user, setUser] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogMessage, setDialogMessage] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [userType, setUserType] = useState("international_buddy");
  const [notification, setNotification] = useState(null);

  // New fields from main
  const [favoriteAnimal, setFavoriteAnimal] = useState("");
  const [profession, setProfession] = useState("");
  const [pronouns, setPronouns] = useState("");

  // Unsaved changes guard (from HEAD)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const pendingNavRef = useRef(null);

  // Bio modal state
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

      const userData = snap.data();

      setFirstName(userData.first_name || "");
      setLastName(userData.last_name || "");
      setBirthday(userData.birthday || "");
      setCountry(userData.country || "");
      setVillage(userData.village || "");
      setGender(userData.gender || "");
      setBio(userData.bio || "");
      setEducationLevel(userData.education_level || "");
      setIsOrphan(userData.is_orphan ? "Yes" : "No");
      setGuardian(userData.guardian || "");
      setDreamJob(userData.dream_job || "");
      setFavoriteColor(userData.favorite_color || "");
      setPhotoUri(userData.photo_uri || "");
      setUserType(userData.user_type || "");
      setFavoriteAnimal(userData.favorite_animal || "");
      setProfession(userData.profession || "");
      setPronouns(userData.pronouns || "");

      if (Array.isArray(userData.hobbies)) {
        setHobbies(userData.hobbies.map((id) => ({ id, label: id })));
      } else if (userData.hobby) {
        setHobbies([
          { id: userData.hobby.toLowerCase(), label: userData.hobby },
        ]);
      } else {
        setHobbies([]);
      }
    };

    fetchProfile();
  }, [user]);

  // Browser close / refresh guard (from HEAD)
  useEffect(() => {
    const handler = (e) => {
      if (!hasUnsavedChanges) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsavedChanges]);

  // Navigation guard (from HEAD)
  const attemptNavigate = (fn) => {
    if (!hasUnsavedChanges) {
      fn();
      return;
    }
    pendingNavRef.current = fn;
    setShowLeaveDialog(true);
  };

  // Bio modal handler
  const handleOpenBioModal = () => {
    setTempBio(bio);
    setIsBioModalOpen(true);
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
      hobbies: hobbies.map((h) => h.id),
      favorite_color: favoriteColor,
      profession,
      favorite_animal: favoriteAnimal,
      pronouns,
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
              pendingNavRef.current = null;
            },
          },
        ]}
      />

      {/* Bio Modal */}
      <Dialog
        isOpen={isBioModalOpen}
        onClose={() => setIsBioModalOpen(false)}
        title="Edit Bio / Challenges"
        content={
          <textarea
            className="w-full border border-gray-300 rounded-lg p-3 min-h-[150px] resize-none"
            value={tempBio}
            onChange={(e) => setTempBio(e.target.value)}
            placeholder="Tell us about yourself or any challenges you face..."
          />
        }
        buttons={[
          { text: "Cancel", onClick: () => setIsBioModalOpen(false) },
          {
            text: "Save",
            onClick: () => {
              setBio(tempBio);
              setHasUnsavedChanges(true);
              setIsBioModalOpen(false);
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
                onClick={() => attemptNavigate(() => router.push("/edit-profile-user-image"))}
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
                Personal Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  id="firstName"
                  label="First name"
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                  error={errors.first_name || ""}
                />
                <Input
                  id="lastName"
                  label="Last name"
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                  error={errors.last_name || ""}
                />
              </div>

              <div className="mt-6 space-y-6">
                <Input
                  id="country"
                  label="Country"
                  value={country}
                  onChange={(e) => {
                    setCountry(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                />

                {/* Pronouns */}
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-500 mb-1">Pronouns</p>
                  <Dropdown
                    options={["He/Him", "She/Her", "Other"]}
                    currentValue={pronouns}
                    valueChange={(v) => {
                      setPronouns(v);
                      setHasUnsavedChanges(true);
                    }}
                    text="Pronouns"
                  />
                </div>

                {(userType === "child" || userType === "local_volunteer") && (
                  <Input
                    id="village"
                    label="Village"
                    value={village}
                    onChange={(e) => {
                      setVillage(e.target.value);
                      setHasUnsavedChanges(true);
                    }}
                  />
                )}

                <div>
                  <p className="text-sm text-gray-500 mb-1">Bio / Challenges</p>
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
                  onChange={(e) => {
                    setBirthday(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                />
              </div>
            </div>

            {userType !== "admin" && (
              <>
                {/* Education */}
                <div className="rounded-2xl bg-white p-4">
                  <h3 className="text-sm font-semibold text-secondary mb-4">
                    Education{" "}
                    {(userType === "child" || userType === "local_volunteer") && (
                      <>{"& Family"}</>
                    )}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-500 mb-1">Education Level</p>
                      <Dropdown
                        options={[
                          "Elementary",
                          "Middle",
                          "High School",
                          "College/University",
                          "No Grade",
                        ]}
                        currentValue={educationLevel}
                        valueChange={(v) => {
                          setEducationLevel(v);
                          setHasUnsavedChanges(true);
                        }}
                        text="Education Level"
                      />

                      {(userType === "child" || userType === "local_volunteer") && (
                        <>
                          {/* Guardian */}
                          <div className="md:col-span-2 pt-6">
                            <p className="text-sm text-gray-500 mb-1">Guardian</p>
                            <Dropdown
                              options={[
                                "Parents",
                                "Adoptive Parents",
                                "Aunt/Uncle",
                                "Grandparents",
                                "Other Family",
                                "Friends",
                                "Other",
                              ]}
                              currentValue={guardian}
                              valueChange={(v) => {
                                setGuardian(v);
                                setHasUnsavedChanges(true);
                              }}
                              text="Guardian"
                            />
                          </div>

                          {/* Orphan */}
                          <div className="md:col-span-2 pt-6">
                            <p className="text-sm text-gray-500 mb-1">Is Orphan</p>
                            <Dropdown
                              options={["Yes", "No"]}
                              currentValue={isOrphan}
                              valueChange={(v) => {
                                setIsOrphan(v);
                                setHasUnsavedChanges(true);
                              }}
                              text="Is Orphan"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Interests */}
                <div className="rounded-2xl bg-white p-4">
                  <h3 className="text-sm font-semibold text-secondary mb-4">
                    Interests
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {userType === "international_buddy" && (
                      <>
                        <Input
                          id="profession"
                          label="Profession"
                          value={profession}
                          onChange={(e) => {
                            setProfession(e.target.value);
                            setHasUnsavedChanges(true);
                          }}
                        />
                        <Input
                          id="favoriteAnimal"
                          label="Favorite animal"
                          value={favoriteAnimal}
                          onChange={(e) => {
                            setFavoriteAnimal(e.target.value);
                            setHasUnsavedChanges(true);
                          }}
                        />
                      </>
                    )}

                    {(userType === "child" || userType === "local_volunteer") && (
                      <>
                        <Input
                          id="dreamjob"
                          label="Dream job"
                          value={dreamJob}
                          onChange={(e) => {
                            setDreamJob(e.target.value);
                            setHasUnsavedChanges(true);
                          }}
                        />
                        <Input
                          id="favoriteColor"
                          label="Favorite color"
                          value={favoriteColor}
                          onChange={(e) => {
                            setFavoriteColor(e.target.value);
                            setHasUnsavedChanges(true);
                          }}
                        />
                        <Input
                          id="favoriteAnimal"
                          label="Favorite animal"
                          value={favoriteAnimal}
                          onChange={(e) => {
                            setFavoriteAnimal(e.target.value);
                            setHasUnsavedChanges(true);
                          }}
                        />
                      </>
                    )}

                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-500 mb-1">Hobby</p>
                      <HobbySelect
                        value={hobbies}
                        onChange={(arr) => {
                          setHobbies(arr);
                          setHasUnsavedChanges(true);
                        }}
                        allowCustom
                        editable
                        placeholder="Select or add hobbies"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

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

        <div className="shrink-0 border-t bg-blue-100">
          <NavBar />
        </div>
      </PageContainer>
    </PageBackground>
  );
}
