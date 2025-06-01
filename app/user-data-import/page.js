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

export default function UserDataImport() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
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
        education_level: formData.get("educationLevel"),
        is_orphan: formData.get("isOrphan") === "Yes",
        gaurdian: formData.get("guardian"),
        dream_job: formData.get("dreamJob"),
        hobby: formData.get("hobby"),
        favorite_color: formData.get("favoriteColor"),
        gender: formData.get("gender"),
      };

      // Custom validation
      if (!userData.first_name.trim()) {
        newErrors.first_name = "First name is required";
      }

      if (!userData.last_name.trim()) {
        newErrors.last_name = "Last name is required";
      }

      if (!userData.email.trim()) {
        newErrors.email = "Email is required";
      } else if (!/\S+@\S+\.\S+/.test(userData.email)) {
        newErrors.email = "Invalid email format";
      }

      if (!userData.birthday.trim()) {
        newErrors.birthday = "Birthday is required";
      }

      if (!userData.gender.trim()) {
        newErrors.gender = "Gender is required";
      }

      if (!userData.country.trim()) {
        newErrors.country = "Country is required";
      }

      if (!userData.village.trim()) {
        newErrors.village = "Village is required";
      }

      if (!userData.education_level.trim()) {
        newErrors.education_level = "Level is required";
      }

      if (!userData.gaurdian.trim()) {
        newErrors.gaurdian = "Guardian is required";
      }

      if (!userData.dream_job.trim()) {
        newErrors.dream_job = "Job is required";
      }

      if (!userData.hobby.trim()) {
        newErrors.hobby = "Hobby is required";
      }

      if (!userData.favorite_color.trim()) {
        newErrors.favorite_color = "Color is required";
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
      alert("User data imported successfully!");
    } catch (error) {
      Sentry.captureException("Error importing user data: " + error);
      alert("Error importing user data");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageBackground>
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
                type="email"
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
                label="birthday"
                error={errors.birthday ? errors.birthday : ""}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Gender
              </label>
              <select
                name="gender"
                className={`mt-1 block w-full rounded-md border ${
                  errors.gender ? "border-red-500" : "border-gray-300"
                } px-3 py-2 text-gray-700`}
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              {errors.gender && (
                <p className="mt-1 text-sm text-red-500">{errors.gender}</p>
              )}
            </div>

            <div>
              <Input
                type="text"
                name="country"
                id="country"
                label="Country"
                error={errors.country ? errors.country : ""}
              />
            </div>

            <div>
              <Input
                type="text"
                id="village"
                name="village"
                label="Village"
                error={errors.village ? errors.village : ""}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Education Level
              </label>
              <select
                name="educationLevel"
                className={`mt-1 block w-full rounded-md border ${
                  errors.gender ? "border-red-500" : "border-gray-300"
                } px-3 py-2 text-gray-700`}
              >
                <option value="">Select level</option>
                <option value="Elementary">Elementary</option>
                <option value="Middle">Middle</option>
                <option value="High School">High School</option>
                <option value="College/University">College/University</option>
                <option value="No Grade">No Grade</option>
              </select>
              {errors.education_level && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.education_level}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Is Orphan
              </label>
              <select
                name="isOrphan"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-700"
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Guardian
              </label>
              <select
                name="guardian"
                className={`mt-1 block w-full rounded-md border ${
                  errors.gaurdian ? "border-red-500" : "border-gray-300"
                } px-3 py-2 text-gray-700`}
              >
                <option value="">Select guardian</option>
                <option value="Parents">Parents</option>
                <option value="AdoptiveParents">Adoptive Parents</option>
                <option value="Aunt/Uncle">Aunt/Uncle</option>
                <option value="Grandparents">Grandparents</option>
                <option value="Other Family">Other Family</option>
                <option value="Friends">Friends</option>
                <option value="Other">Other</option>
              </select>
              {errors.gaurdian && (
                <p className="mt-1 text-sm text-red-500">{errors.gaurdian}</p>
              )}
            </div>

            <div>
              <Input
                type="text"
                name="dreamJob"
                id="dream-job"
                label="Dream Job"
                error={errors.dream_job ? errors.dream_job : ""}
              />
            </div>

            <div>
              <Input
                type="text"
                id="hobby"
                name="hobby"
                label="Hobby"
                error={errors.hobby ? errors.hobby : ""}
              />
            </div>

            <div>
              <Input
                type="text"
                name="favoriteColor"
                id="favorite-color"
                label="Favorite Color"
                error={errors.favorite_color ? errors.favorite_color : ""}
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
