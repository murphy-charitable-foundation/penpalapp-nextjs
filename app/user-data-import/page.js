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
import * as Sentry from "@sentry/nextjs";
import Dialog from "../../components/general/Modal";
import Dropdown from "../../components/general/Dropdown";

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

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

      if (userData.email.trim() && !/\S+@\S+\.\S+/.test(userData.email)) {
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
      Sentry.captureException("Error importing user data: " + error);
      setIsDialogOpen(true);
      setDialogTitle("Oops");
      setDialogMessage("Error importing user data.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageBackground>
      <Dialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
        }}
        title={dialogTitle}
        content={dialogMessage}
      ></Dialog>
      <PageContainer maxWidth="lg">
        <PageHeader title="Import User Data" />

        <form onSubmit={handleSubmit} className="space-y-6  p-6 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div>
              <Input
                type="text"
                id="first-name"
                name="firstName"
                label="First Name"
                error={errors.first_name ? errors.first_name : ""}
              />
            </div>

            <div>
              <Input
                type="text"
                id="last-name"
                name="lastName"
                label="Last Name"
                error={errors.last_name ? errors.last_name : ""}
              />
            </div>

            <div>
              <Input
                type="text"
                name="email"
                id="email"
                label="Email"
                error={errors.email ? errors.email : ""}
              />
            </div>

            <div>
              <Input
                type="date"
                id="birthday"
                name="birthday"
                label="Birthday"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500">
                Gender
              </label>
              <Dropdown
                options={["Male", "Female", "Other"]}
                valueChange={(option) => {
                  setGender(option);
                }}
                currentValue={gender}
                text="Gender"
              />
            </div>

            <div>
              <Input type="text" name="country" id="country" label="Country" />
            </div>

            <div>
              <Input type="text" id="village" name="village" label="Village" />
            </div>

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
                valueChange={(option) => {
                  setEducationLevel(option);
                }}
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
                valueChange={(option) => {
                  setIsOrphan(option);
                }}
                currentValue={isOrphan}
                text="Status"
              />
            </div>

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
                valueChange={(option) => {
                  setGuardian(option);
                }}
                currentValue={guardian}
                text="Education"
              />
            </div>

            <div>
              <Input
                type="text"
                name="dreamJob"
                id="dream-job"
                label="Dream Job"
              />
            </div>

            <div>
              <Input type="text" id="hobby" name="hobby" label="Hobby" />
            </div>

            <div>
              <Input
                type="text"
                name="favoriteColor"
                id="favorite-color"
                label="Favorite Color"
              />
            </div>
          </div>

          <div className="col-span-2">
            <TextArea
              name="bio"
              rows={3}
              maxLength={50}
              label="Bio/Challenges Faced"
            />
          </div>

          <div className="flex justify-center">
            <Button
              btnType="submit"
              btnText={isSubmitting ? "Importing..." : "Import User Data"}
              disabled={isSubmitting}
            />
          </div>
        </form>
      </PageContainer>
    </PageBackground>
  );
}
