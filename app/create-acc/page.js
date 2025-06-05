"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import Link from "next/link";
import Image from "next/image";
import { updatePassword, signOut } from "firebase/auth";
import { handleLogout } from "../profile/page";
import EditProfileImage from "../../components/edit-profile";
import * as Sentry from "@sentry/nextjs";
import PasswordChecklist from "react-password-checklist";
import Input from "../../components/general/Input";
import Button from "../../components/general/Button";
import { BackButton } from "../../components/general/BackButton";
import { PageBackground } from "../../components/general/PageBackground";
import { PageContainer } from "../../components/general/PageContainer";
import Dialog from "../../components/general/Modal";

export default function CreateAccount() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [birthday, setBirthday] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [showPasswordChecklist, setShowPasswordChecklist] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [errors, setErrors] = useState({});
  const [isValidPassword, setisValidPassword] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const [dialogTitle, setDialogTitle] = useState("");
  const router = useRouter();

  // Pre-populate email from auth.currentUser

  useEffect(() => {
    if (auth.currentUser?.email) {
      setEmail(auth.currentUser.email);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Custom validation
    const newErrors = {};
    if (!firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Invalid email format";
    }

    if (!isValidPassword) {
      newErrors.isValidPassword = "Not a valid password.";
    }
    if (password !== repeatPassword) {
      newErrors.repeatPassword = "Passwords do not match.";
    }

    try {
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        throw new Error("Form validation error(s)");
      }
      const user = auth.currentUser;

      console.log(`user is :${user}`);
      const uid = user.uid;
      try {
        await updatePassword(user, password);
      } catch (error) {
        if (error.code == "auth/requires-recent-login") {
          console.error("Account creation timed out: ", error.message);
          setIsDialogOpen(true);
          setDialogTitle("Oops!");
          setDialogMessage(
            "Account creation timed out. Please try logging in again."
          );
          await signOut(auth);
          router.push("/login");
          return;
        } else {
          console.error("Failed to change password: ", error.message);
          throw error;
        }
      }

      // Create a document in Firestore in "users" collection with UID as the document key
      await setDoc(doc(db, "users", uid), {
        created_at: new Date(),
        first_name: firstName,
        last_name: lastName,
        birthday,
        connected_penpals_count: 0,
      });
      // Create a document in Firestore in "users" collection with UID as the document key
      await setDoc(doc(db, "users", uid), {
        created_at: new Date(),
        first_name: firstName,
        last_name: lastName,
        birthday,
        connected_penpals_count: 0,
      });

      setShowCreate(false);
      localStorage.setItem("userFirstName", firstName);
      // Redirect to profile page or any other page as needed
      router.push("/welcome/");
    } catch (error) {
      Sentry.captureException("Error creating account:", error);
      setIsDialogOpen(true);
      setDialogTitle("Oops!");
      setDialogMessage("Error: " + error.message);
    }
  };

  return (
    <PageBackground className="flex flex-col items-center justify-center px-4">
      <Dialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
        }}
        title={dialogTitle}
        content={dialogMessage}
      ></Dialog>
      <PageContainer>
        <div className="flex items-center justify-between mb-4">
          <BackButton />
          <h2 className="flex-grow text-center text-2xl font-bold text-gray-800">
            Create account
          </h2>
        </div>
        <div className="flex justify-center mb-6">
          <Image
            src="/murphylogo.png"
            alt="Your Logo"
            width={150}
            height={150}
          />
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="flex gap-4">
            <div className="w-1/2">
              <Input
                label="First name"
                id="first-name"
                placeholder="Ex: Jane"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                error={errors.firstName ? errors.firstName : ""}
              />
            </div>
            <div className="w-1/2">
              <Input
                label="Last Name"
                id="last-name"
                placeholder="Ex: Doe"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                error={errors.lastName ? errors.lastName : ""}
              />
            </div>
          </div>
          <div>
            <Input
              id="birthday"
              type="date"
              label="Birthday"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
            />
          </div>

          <div>
            <Input
              id="email"
              name="email"
              type="email"
              label="Email"
              autoComplete="email"
              placeholder="Ex: someone@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email ? errors.email : ""}
            />
          </div>
          <div>
            <Input
              id="password"
              name="password"
              type="password"
              label="New Password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setShowPasswordChecklist(e.target.value.length > 0);
              }}
              error={errors.isValidPassword ? errors.isValidPassword : ""}
            />
          </div>
          {showPasswordChecklist && (
            <PasswordChecklist
              rules={["minLength", "specialChar", "number", "capital", "match"]}
              minLength={8}
              value={password}
              valueAgain={repeatPassword}
              onChange={(isValid, failedRules) => {
                setisValidPassword(isValid);
                if (failedRules.length === 1 && failedRules.includes("match")) {
                  setisValidPassword(true);
                }
              }}
              className="text-black"
            />
          )}
          <div>
            <Input
              id="repeat-password"
              name="repeatPassword"
              type="password"
              label="Repeat Password"
              value={repeatPassword}
              onChange={(e) => setRepeatPassword(e.target.value)}
              error={errors.repeatPassword ? errors.repeatPassword : ""}
            />
          </div>
          {/*onClick={() => router.push('/terms-conditions')}  */}
          <div className="flex items-center justify-center">
            <Input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label
              htmlFor="remember-me"
              className="ml-2 block text-sm text-gray-900"
            >
              See the{" "}
              <Link href="/terms-conditions" className="underline">
                terms and conditions
              </Link>{" "}
              and{" "}
              <Link className="underline" href="privacy-policy">
                privacy policy
              </Link>
            </label>
          </div>

          <div className="flex justify-center">
            <Button btnType="submit" btnText="Create Account" color="green" />
          </div>
        </form>

        {/* <EditProfileImage router={router} /> */}
      </PageContainer>
    </PageBackground>
  );
}
