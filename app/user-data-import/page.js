"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../../app/firebaseConfig";
import { PageContainer } from "../../components/general/PageContainer";
import { PageHeader } from "../../components/general/PageHeader";
import { PageBackground } from "../../components/general/PageBackground";
import Input from "../../components/general/Input";
import Button from "../../components/general/Button";
import TextArea from "../../components/general/TextArea";
import * as Sentry from "@sentry/nextjs";
import Dialog from "../../components/general/Dialog";
import Dropdown from "../../components/general/Dropdown";
import { usePageAnalytics } from "../useAnalytics";
import { logButtonEvent, logError } from "../utils/analytics";

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
        first_name: formData.get("firstName"),
        last_name: formData.get("lastName"),
        email: formData.get("email"),
        birthday: formData.get("birthday"),
        country: formData.get("country"),
        village: formData.get("village"),
        bio: formData.get("bio"),
        education_level: educationLevel,
        is_orphan: isOrphan === "Yes",
        guardian: guardian,
        dream_job: formData.get("dreamJob"),
        hobby: formData.get("hobby"),
        favorite_color: formData.get("favoriteColor"),
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
      console.log("no errors");
      // Generate a unique ID for the user
      const userId = crypto.randomUUID();
      await setDoc(doc(db, "users", userId), userData);

      // Reset form
      e.currentTarget.reset();
      setIsDialogOpen(true);
      setDialogTitle("Congratulations!");
      setDialogMessage("User data imported successfully!");
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
      {/* ===== DIALOG (OVERLAY) ===== */}
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
          className="min-h-[92dvh] flex flex-col bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          {/* ===== HEADER ===== */}
          <PageHeader title="Import User Data" imagesize="sm" />

          {/* ===== SINGLE SCROLLER ===== */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 py-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* BASIC INFO */}
                <Input
                  type="text"
                  name="firstName"
                  label="First Name"
                  error={errors.first_name || ""}
                />

                <Input
                  type="text"
                  name="lastName"
                  label="Last Name"
                  error={errors.last_name || ""}
                />

                <Input
                  type="text"
                  name="email"
                  label="Email"
                  error={errors.email || ""}
                />

                <Input
                  type="date"
                  name="birthday"
                  label="Birthday"
                />

                {/* GENDER */}
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

                <Input name="country" label="Country" />
                <Input name="village" label="Village" />

                {/* EDUCATION */}
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

                {/* ORPHAN */}
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

                {/* GUARDIAN */}
                <div>
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

                <Input name="dreamJob" label="Dream Job" />
                <Input name="hobby" label="Hobby" />
                <Input name="favoriteColor" label="Favorite Color" />
              </div>

              {/* BIO */}
              <TextArea
                name="bio"
                rows={3}
                maxLength={50}
                label="Bio / Challenges Faced"
              />

              {/* SUBMIT */}
              <div className="flex justify-center pt-4">
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
