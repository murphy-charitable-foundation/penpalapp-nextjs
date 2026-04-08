"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { doc, updateDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../firebaseConfig";
import { useUser } from "../../contexts/UserContext";

import { PageContainer } from "../../components/general/PageContainer";
import { PageHeader } from "../../components/general/PageHeader";
import { PageBackground } from "../../components/general/PageBackground";
import Input from "../../components/general/Input";
import Button from "../../components/general/Button";
import TextArea from "../../components/general/TextArea";
import Dialog from "../../components/general/Dialog";
import Dropdown from "../../components/general/Dropdown";

import { usePageAnalytics } from "../useAnalytics";
import { logButtonEvent, logError } from "../utils/analytics";
import HobbySelect from "../../components/general/HobbySelect";
import { createConnection } from "../utils/letterboxFunctions";
import Image from "next/image";
import AvatarUploadModal from "../../components/AvatarUploadModal";
import { uploadFile } from "../lib/uploadFile";
import LoadingSpinner from "../../components/loading/LoadingSpinner";

export default function CreateChildProfile() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const [dialogTitle, setDialogTitle] = useState("");

  const [pronouns, setPronouns] = useState("");
  const [educationLevel, setEducationLevel] = useState("");
  const [isOrphan, setIsOrphan] = useState("");
  const [guardian, setGuardian] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [hobbies, setHobbies] = useState([]); // [{id,label}]

  const [croppedImage, setCroppedImage] = useState(null);
  const [croppedBlob, setCroppedBlob] = useState(null);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const auth = getAuth();
  const { userType, loading: userLoading } = useUser();
  usePageAnalytics("/user-data-import");

  // Check if user is admin
  useEffect(() => {
    if (!userLoading && userType && userType !== "admin") {
      setDialogTitle("Access Denied");
      setDialogMessage("You do not have authorization to access this page. Only admins can create child profiles.");
      setIsDialogOpen(true);
      
      // Redirect to login after dialog closes
      const timer = setTimeout(() => {
        router.push("/login");
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [userType, userLoading, router]);



  // Handle avatar selection from AvatarUploadModal
  const handleAvatarSelected = (blob) => {
    setCroppedBlob(blob);
    // Generate preview URL from blob
    setCroppedImage(URL.createObjectURL(blob));
    setShowAvatarModal(false);
  };

const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    logButtonEvent("/user-data-import", "Import User Data button clicked!");

    try {
      const newErrors = {};
      const formData = new FormData(e.currentTarget);
      const internationalBuddyEmail = formData.get("internationalbuddyemail"); 
      let email = formData.get("email");
      const password = formData.get("password");
      const birthday = formData.get("birthday");
      
      const userData = {
        first_name: (() => { const s = formData.get("firstName").trim(); return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : ""; })(),
        last_name: (() => { const s = formData.get("lastName").trim(); return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : ""; })(),
        birthday: (formData.get("birthday") || "").toString(),
        country: (formData.get("country") || "").toString(),
        village: (formData.get("village") || "").toString(),
        bio: (formData.get("bio") || "").toString(),
        education_level: educationLevel,
        is_orphan: isOrphan === "Yes",
        guardian: guardian,
        dream_job: (formData.get("dreamJob") || "").toString(),

        // Backward compatible + new schema
        hobbies: hobbies.map((h) => h.id), 

        favorite_color: (formData.get("favoriteColor") || "").toString(),
        user_type: "child",
        connected_penpals_count: 0,
        pronouns: pronouns,
        favorite_animal: formData.get("favoriteAnimal"),
      };

      // Generate default email if not provided
      if (!email || !email.trim()) {
        if (!birthday) {
          newErrors.birthday = "Birthday is required to generate email";
        } else {
          const firstNameLetter = userData.first_name.charAt(0).toLowerCase();
          const lastName = userData.last_name.toLowerCase();
          const yearLastTwoDigits = birthday.toString().slice(2,4);
          email = `rez+${firstNameLetter}${lastName}${yearLastTwoDigits}@murphycharity.org`;
        }
      }

      // Custom validation
      if (!userData.first_name.trim() && !userData.last_name.trim()) {
        newErrors.first_name = "Name is required";
        newErrors.last_name = "Name is required";
      }

      if (!/\S+@\S+\.\S+/.test(email) && email !== "") {
        newErrors.email = "Invalid email format";
      }

       if (!/\S+@\S+\.\S+/.test(internationalBuddyEmail) && internationalBuddyEmail !== "") {
        newErrors.internationalbuddyemail = "Invalid email format";
      }


      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      let internationalBuddyUid = null;
      let createJson = null;
      try {
        if (!auth.currentUser) {
          throw new Error("You must be logged in to import user data");
        }
        const token = await auth.currentUser.getIdToken();
        
        // Fetch UID of international buddy only if email is provided
        if (internationalBuddyEmail.trim()) {
          const uidRes = await fetch("/api/getUidByEmail", {
            method: "POST",
            headers: { 
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json" },
            body: JSON.stringify({ email: internationalBuddyEmail }),
          });

          internationalBuddyUid = await uidRes.json();
          if (!uidRes.ok) {
            newErrors.internationalbuddyemail = internationalBuddyUid.error || "No user found with this email";
            setErrors(newErrors);
            throw new Error (internationalBuddyUid.error || "No user found with this email");
          }
        }

        // Create user via server-side Admin API so current user stays signed in
        const createRes = await fetch("/api/createChild", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, userData }),
        });

        createJson = await createRes.json();
        if (!createRes.ok) {
          newErrors.email = createJson.error || "Failed to create child";
          setErrors(newErrors);
          throw new Error(createJson.error || "Failed to create child");
        }
      } catch (error) {
        logError(error, {
          description: "Error creating child or finding the international buddy: ",    
        })
        throw error;
      }

        const kidId = createJson.uid;
        const kidRef = doc(db, "users", kidId);

        const buddyRef = doc(db, "users", internationalBuddyUid.uid);
        await createConnection(buddyRef, kidRef);

        // Upload profile image if available
        if (croppedBlob) {
          setLoading(true);
          uploadFile(croppedBlob, `profile/${kidId}/profile-image`, 
            (progress) => {
              console.log('Upload progress:', progress);
              if (progress === 100) {
                setLoading(false);
              }
            },
            (error) => {
              logError(error, { description: "Error uploading profile image" });
            },
            async (url) => {
              // Update user photo_uri
              const userRef = doc(db, "users", kidId);
              await updateDoc(userRef, { photo_uri: url });
            }
          );
        }

      // Reset form
      setHobbies([]);
      setCroppedBlob(null);
      setCroppedImage(null);
      setShowAvatarModal(false);
      e.target?.closest('form')?.reset();
      setIsDialogOpen(true);
      setDialogTitle("Congratulations!");
      setDialogMessage("User data imported successfully!");
      setErrors({});
    } catch (error) {
      logError(error, {
        description: "Error importing user data: ",
      });
      setIsDialogOpen(true);
      setDialogTitle("Oops");
      setDialogMessage("Error importing user data.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageBackground className="bg-gray-100 h-screen overflow-hidden flex flex-col">
      {loading && <LoadingSpinner />}
      <Dialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={dialogTitle}
        content={dialogMessage}
      />

      {showAvatarModal && (
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[998]"
            onClick={() => setShowAvatarModal(false)}
          />
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
            <div
              className="w-full max-w-md bg-white rounded-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <AvatarUploadModal
                autoSave={false}
                onContinue={handleAvatarSelected}
                onBackClick={() => setShowAvatarModal(false)}
                continueText="Select"
                skipText="Skip"
                colors={{ primary: "#4E802A", dark: "#034792", bg: "#f3f4f6" }}
                pageAnalyticsPath="/create-child-profile"
              />
            </div>
          </div>
        </>
      )}

      <div className="flex-1 min-h-0 flex justify-center">
        <PageContainer
          width="compactXS"
          padding="none"
          center={false}
          className="min-h-[100dvh] flex flex-col bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          <PageHeader title="Import User Data" image={false} />

          {/* Single scroller */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 py-6">
            {/* Upload profile image */}
            <div className="flex justify-center">
              {croppedImage ? (
                <img src={croppedImage} alt="Profile" width={200} className="rounded-full" />
              ) : (
               <Image src="/murphylogo.png" alt="Foundation Logo" width={200} height={200} />
              )}
            </div>
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={() => setShowAvatarModal(true)}
                className="px-4 py-2 border border-gray-400 text-green-700 font-normal rounded-full hover:bg-gray-100 transition"
              >
                Upload Photo
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="rounded-2xl bg-white p-4">
                <h3 className="text-sm font-semibold text-secondary mb-4">
                  Basic Info:
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    type="text"
                    name="firstName"
                    label="First Name"
                    error={errors.first_name}
                    onChange={(e) => setFirstName(e.target.value)}
                  />

                  <Input
                    type="text"
                    name="lastName"
                    label="Last Name"
                    error={errors.last_name}
                    onChange={(e) => setLastName(e.target.value)}
                  />

                  <Input type="date" name="birthday" label="Birthday" error={errors.birthday} onChange={(e) => setBirthday(e.target.value)}/>

                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      Pronouns
                    </label>
                    <Dropdown
                      options={[                       
                        "He/Him",
                        "She/Her",
                        "Other"
                      ]}
                      valueChange={setPronouns}
                      currentValue={pronouns}
                      text="Pronouns"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Input
                      type="text"
                      name="email"
                      id="email"
                      label="Child's Email"
                      placeholder={`rez+${firstName?.slice(0, 1) || ""}${lastName || ""}${birthday?.slice(2, 4) || ""}@murphycharity.org`}
                      error={errors.email ? errors.email : ""}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Input
                      type="password"
                      name="password"
                      id="password"
                      label="Password"
                      placeholder="Enter a secure password"
                      error={errors.password ? errors.password : ""}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Input
                      type="text"
                      name="internationalbuddyemail"
                      id="internationalbuddyemail"
                      label="International Buddy's Email"
                      placeholder="buddy@example.com"
                      error={errors.internationalbuddyemail ? errors.internationalbuddyemail : ""}
                    />
                  </div>
                
                </div>
              </div>

              {/* Background */}
              <div className="rounded-2xl bg-white p-4">
                <h3 className="text-sm font-semibold text-secondary mb-4">
                  Background:
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input name="country" label="Country" />
                  <Input name="village" label="Village" />

                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      Education Level
                    </label>
                    <Dropdown
                      options={[
                        "Elementary",
                        "Middle",
                        "High School",
                        "College/University",
                        "No Grade",
                      ]}
                      valueChange={setEducationLevel}
                      currentValue={educationLevel}
                      text="Education"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      Is Orphan
                    </label>
                    <Dropdown
                      options={["No", "Yes"]}
                      valueChange={setIsOrphan}
                      currentValue={isOrphan}
                      text="Status"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-500">
                      Guardian
                    </label>
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
                      valueChange={setGuardian}
                      currentValue={guardian}
                      text="Guardian"
                    />
                  </div>
                </div>
              </div>

              {/* Interests */}
              <div className="rounded-2xl bg-white p-4">
                <h3 className="text-sm font-semibold text-secondary mb-4">
                  Interests:
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input name="dreamJob" label="Dream Job" />
                  <Input name="favoriteColor" label="Favorite Color" />
                  <Input name="favoriteAnimal" label="Favorite Animal" />
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-500">
                      Hobby
                    </label>
                    <HobbySelect
                      value={hobbies}
                      onChange={setHobbies}
                      allowCustom
                      editable
                      placeholder="Select or add hobbies"
                    />
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div className="rounded-2xl bg-white p-4">
                <h3 className="text-sm font-semibold text-secondary mb-4">
                  Bio:
                </h3>

                <div className="grid grid-cols-1 gap-6">
                  <TextArea
                    name="bio"
                    rows={3}
                    maxLength={50}
                    label="Bio / Challenges Faced"
                  />
                </div>
              </div>

              {/* Submit */}
              <div className="flex justify-center pt-2 pb-6">
                <Button
                  btnType="submit"
                  btnText={isSubmitting ? "Importing..." : "Import User Data"}
                  disabled={isSubmitting}
                />
              </div>
            </form>
          </div>
        </PageContainer>
      </div>
    </PageBackground>
  );
}
