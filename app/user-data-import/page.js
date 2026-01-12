"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, Timestamp, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
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
import { createConnection } from "../utils/letterboxFunctions";

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
  const auth = getAuth();
  usePageAnalytics("/user-data-import");

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
        email: "",
        birthday: formData.get("birthday") ? Timestamp.fromDate(new Date(formData.get("birthday"))) : null,
        country: formData.get("country"),
        village: formData.get("village"),
        bio: formData.get("bio"),
        education_level: educationLevel,
        is_orphan: isOrphan === "Yes",
        guardian: guardian,
        dream_job: formData.get("dreamJob"),
        hobby: formData.get("hobby"),
        favorite_color: formData.get("favoriteColor"),
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

      if (!/\S+@\S+\.\S+/.test(userData.email) && userData.email !== "") {
        newErrors.email = "Invalid email format";
      }

       if (!/\S+@\S+\.\S+/.test(internationalBuddyEmail) && internationalBuddyEmail !== "") {
        newErrors.internationalbuddyemail = "Invalid email format";
      }


      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      // Fetch UID of international buddy
      const uidRes = await fetch("/api/getUidByEmail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: internationalBuddyEmail }),
      });

      const internationalBuddyUid = await uidRes.json();

      if (!uidRes.ok) {
        newErrors.internationalbuddyemail = "No user found with this email";
        setErrors(newErrors);
        return;
      }

      try {

        // Create user via server-side Admin API so current user stays signed in
        const createRes = await fetch("/api/createUser", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, userData }),
        });

        const createJson = await createRes.json();
        if (!createRes.ok) {
          throw new Error(createJson.error || "Failed to create user");
        }

        const kidId = createJson.uid;

        const kidRef = doc(db, "users", kidId);
        const docSnap = await getDoc(kidRef);
        if (docSnap.exists()) {
          const kid = { id: kidId, ...docSnap.data(), photoURL: "/usericon.png" };
          const internationalBuddyUID = internationalBuddyUid.uid;
          const buddyRef = doc(db, "users", internationalBuddyUID);
          const letterboxRef = await createConnection(buddyRef, kid);
        } else {
          throw new Error("Error creating user");
        }

      } catch (error) {
        newErrors.email = "email already in use";
        setErrors(newErrors);
        return;
      }

      // Reset form
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
                placeholder="e.g., Jane"
                error={errors.first_name ? errors.first_name : ""}
              />
            </div>

            <div>
              <Input
                type="text"
                id="last-name"
                name="lastName"
                label="Last Name"
                placeholder="e.g., Smith"
                error={errors.last_name ? errors.last_name : ""}
              />
            </div>

            <div>
              <Input
                type="text"
                name="email"
                id="email"
                label="Email"
                placeholder="me@example.com"
                error={errors.email ? errors.email : ""}
              />
            </div>

            <div>
              <Input
                type="text"
                name="internationalbuddyemail"
                id="internationalbuddyemail"
                label="International Buddy's Email"
                placeholder="buddy@example.com"
                error={errors.internationalbuddyemail ? errors.internationalbuddyemail : ""}
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
              <Input 
                type="text" 
                name="pronouns" 
                id="pronouns" 
                label="Pronouns"
                placeholder="e.g., she/her"
              />
            </div>
            
            {/* 
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
            */}

            <div>
              <Input 
                type="text" 
                name="country" 
                id="country" 
                label="Country" 
                placeholder="e.g., Canada"
              />
            </div>

            <div>
              <Input 
                type="text" 
                id="village" 
                name="village" 
                label="Village"
                placeholder="e.g., Toronto"
              />
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
                placeholder="e.g., Pilot"
              />
            </div>

            <div>
              <Input 
                type="text" 
                id="hobby" 
                name="hobby" 
                label="Hobby"
                placeholder="e.g., Reading"
              />
            </div>

            <div>
              <Input
                type="text"
                name="favoriteColor"
                id="favorite-color"
                label="Favorite Color"
                placeholder="e.g., Blue"
              />
            </div>

            <div>
              <Input
                type="text"
                name="favoriteAnimal"
                id="favorite-animal"
                label="Favorite Animal"
                placeholder="e.g., Dog"
              />
            </div>
          </div>

          <div className="col-span-2">
            <TextArea
              name="bio"
              rows={3}
              maxLength={50}
              label="Bio/Challenges Faced"
              placeholder="Write a short bio or mention any challenges you face."
            />
          </div>
          <div>
  <Input
    type="password"
    name="password"
    id="password"
    label="Password"
    placeholder="Enter a secure password"
    error={errors.password ? errors.password : ""}
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
