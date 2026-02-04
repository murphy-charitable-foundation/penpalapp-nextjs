"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../../app/firebaseConfig";

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
import { logButtonEvent } from "../utils/analytics";
import HobbySelect from "../../components/general/HobbySelect";

export default function UserDataImport() {
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

  const router = useRouter();
  usePageAnalytics("/user-data-import");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    logButtonEvent("/user-data-import", "Import User Data button clicked!");

    try {
      const newErrors = {};
      const formData = new FormData(e.currentTarget);

      const userData = {
        first_name: (formData.get("firstName") || "").toString(),
        last_name: (formData.get("lastName") || "").toString(),
        email: (formData.get("email") || "").toString(),
        birthday: (formData.get("birthday") || "").toString(),
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
      };

      // Custom validation
      if (!userData.first_name.trim() && !userData.last_name.trim()) {
        newErrors.first_name = "Name is required";
        newErrors.last_name = "Name is required";
      }

      if (!userData.email.trim()) {
        newErrors.email = "Email is required";
      } else if (!/\S+@\S+\.\S+/.test(userData.email)) {
        newErrors.email = "Invalid email format";
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      const userId = crypto.randomUUID();
      await setDoc(doc(db, "users", userId), userData);

      e.currentTarget.reset();
      setHobbies([]);

      setIsDialogOpen(true);
      setDialogTitle("Congratulations!");
      setDialogMessage("User data imported successfully!");
    } catch (error) {
      logError(error, { description: "Error importing user data:", error});
      setIsDialogOpen(true);
      setDialogTitle("Oops");
      setDialogMessage("Error importing user data.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageBackground className="bg-gray-100 h-screen overflow-hidden flex flex-col">
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
          <PageHeader title="Import User Data" imageSize="sm" />

          {/* Single scroller */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 py-6">
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

                  <Input
                    type="text"
                    name="email"
                    label="Email"
                    error={errors.email}
                  />

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
