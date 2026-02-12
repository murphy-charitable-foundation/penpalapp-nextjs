"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { doc, setDoc, Timestamp, getDoc, updateDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../firebaseConfig";

import { PageContainer } from "../../components/general/PageContainer";
import { PageHeader } from "../../components/general/PageHeader";
import { PageBackground } from "../../components/general/PageBackground";
import Input from "../../components/general/Input";
import Button from "../../components/general/Button";
import TextArea from "../../components/general/TextArea";
import Dialog from "../../components/general/Dialog";
import Dropdown from "../../components/general/Dropdown";

import * as Sentry from "@sentry/nextjs";
import { usePageAnalytics } from "../useAnalytics";
import { logButtonEvent, logError } from "../utils/analytics";
import HobbySelect from "../../components/general/HobbySelect";
import { createConnection } from "../utils/letterboxFunctions";
import Image from "next/image";
import logo from "../../public/murphylogo.png";
import EditProfileImage from "../../components/edit-profile-image";
import { uploadFile } from "../lib/uploadFile";
import LoadingSpinner from "../../components/loading/LoadingSpinner";

export default function CreateChildProfile() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const [dialogTitle, setDialogTitle] = useState("");

  const [gender, setGender] = useState("");
  const [educationLevel, setEducationLevel] = useState("");
  const [isOrphan, setIsOrphan] = useState("");
  const [guardian, setGuardian] = useState("");

  const [hobbies, setHobbies] = useState([]); // [{id,label}]

  const [selectedFile, setSelectedFile] = useState(null);
  const [croppedImage, setCroppedImage] = useState(null);
  const [croppedBlob, setCroppedBlob] = useState(null);
  const [showCropper, setShowCropper] = useState(false);

  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const auth = getAuth();
  const fileInputRef = useRef(null);
  const cropperRef = useRef(null);
  usePageAnalytics("/user-data-import");

  const handleImageClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setShowCropper(true);
      // Reset the input value to allow selecting the same file again
      fileInputRef.current.value = '';
    }
  };

  const handleCrop = () => {
    const cropper = cropperRef.current?.cropper;
    if (cropper) {
      const canvas = cropper.getCroppedCanvas();
      canvas.toBlob((blob) => {
        setCroppedBlob(blob);
        setCroppedImage(URL.createObjectURL(blob));
        setShowCropper(false);
      });
    }
  };

  const handleCancelCrop = () => {
    setSelectedFile(null);
    setShowCropper(false);
  };

const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    logButtonEvent("/user-data-import", "Import User Data button clicked!");

    try {
      const newErrors = {};
      const formData = new FormData(e.currentTarget);
      const internationalBuddyEmail = formData.get("internationalbuddyemail"); 
      const email = formData.get("email");
      const password = formData.get("password");
      const userData = {
        first_name: (() => { const s = formData.get("firstName").trim(); return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : ""; })(),
        last_name: (() => { const s = formData.get("lastName").trim(); return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : ""; })(),
        birthday: formData.get("birthday") ? Timestamp.fromDate(new Date(formData.get("birthday"))) : null,
        country: (formData.get("country") || "").toString(),
        village: (formData.get("village") || "").toString(),
        bio: (formData.get("bio") || "").toString(),
        education_level: educationLevel,
        is_orphan: isOrphan === "Yes",
        guardian: guardian,
        dream_job: (formData.get("dreamJob") || "").toString(),

        // Backward compatible + new schema
        hobby: hobbies[0]?.label || "",
        hobbies: hobbies.map((h) => h.id), 

        favorite_color: (formData.get("favoriteColor") || "").toString(),
        gender: gender,
        user_type: "child",
        connected_penpals_count: 0,
        pronouns: formData.get("pronouns"),
        favorite_animal: formData.get("favoriteAnimal"),
      };

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
      try {
        if (!auth.currentUser) {
          throw new Error("You must be logged in to import user data");
        }
        const token = await auth.currentUser.getIdToken();
        
        // Fetch UID of international buddy only if email is provided
        let internationalBuddyUid = null;
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

        const createJson = await createRes.json();
        if (!createRes.ok) {
          newErrors.email = createJson.error || "Failed to create user";
          setErrors(newErrors);
          throw new Error(createJson.error || "Failed to create user");
        }

        const kidId = createJson.uid;

        const kidRef = doc(db, "users", kidId);
        const docSnap = await getDoc(kidRef);
        if (docSnap.exists()) {
          const kid = { id: kidId, ...docSnap.data(), photoURL: "/usericon.png" };

          if (internationalBuddyUid) {
            const internationalBuddyUID = internationalBuddyUid.uid;
            const buddyRef = doc(db, "users", internationalBuddyUID);
            const letterboxRef = await createConnection(buddyRef, kid);
          }
        } else {
          throw new Error("Error linking user");
        }

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

      } catch (error) {
        logError(error, {
          description: "Error creating user or linking international buddy: ",    
        })
        throw error;
      }

      // Reset form
      setHobbies([]);
      setCroppedBlob(null);
      setCroppedImage(null);
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
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{display: 'none'}} />
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={handleImageClick}
                className="px-4 py-2 border border-gray-400 text-green-700 font-normal rounded-full hover:bg-gray-100 transition"
              >
                Upload Photo
              </button>
            </div>
            {showCropper && (
              <div className="fixed inset-0 z-[1000] flex items-center justify-center backdrop-blur-sm">
                <div
                  className={"fixed inset-0 bg-black bg-opacity-50 transition-opacity z-[1001]"}
                  onClick={() => handleCancelCrop()}                
                  />
                <div className={"relative w-78 max-w-sm bg-white rounded-xl shadow-xl p-6 text-gray-800 border border-gray-200 transform transition-all z-[1002]"}>
                  <div className="flex justify-center">
                    <EditProfileImage
                      image={URL.createObjectURL(selectedFile)}
                      newProfileImage={null}
                      previewURL={null}
                      handleDrop={() => {}}
                      handleCrop={() => {}}
                      cropperRef={cropperRef}
                      onDone={handleCrop}
                    />
                  </div>
                </div>
              </div>
            )}

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
                  />

                  <Input
                    type="text"
                    name="lastName"
                    label="Last Name"
                    error={errors.last_name}
                  />

                  <div className="md:col-span-2">
                    <Input
                      type="text"
                      name="email"
                      id="email"
                      label="Child's Email"
                      placeholder="me@example.com"
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

                  <Input type="date" name="birthday" label="Birthday" />

                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      Gender
                    </label>
                    <Dropdown
                      options={["Male", "Female", "Other"]}
                      valueChange={setGender}
                      currentValue={gender}
                      text="Gender"
                    />
                  </div>
                
                  <div className="md:col-span-2">
                    <Input 
                      type="text" 
                      name="pronouns" 
                      id="pronouns" 
                      label="Pronouns"
                      placeholder="e.g., she/her"
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
