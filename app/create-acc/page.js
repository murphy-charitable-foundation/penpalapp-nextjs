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

export default function CreateAccount() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [birthday, setBirthday] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [showPasswordChecklist, setShowPasswordChecklist] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const router = useRouter();

  // Pre-populate email from auth.currentUser
  useEffect(() => {
    if (auth.currentUser?.email) {
      setEmail(auth.currentUser.email);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== repeatPassword) {
      alert("Passwords do not match.");
      return;
    }
    try {
      // const userCredential = await createUserWithEmailAndPassword(
      //   auth,
      //   email,
      //   password
      // );

      const user = auth.currentUser;
      // const user = userCredential.currentUser;

      console.log(`user is :${user}`);
      const uid = user.uid;
      try {
        await updatePassword(user, password);
      } catch (error) {
        if (error.code == "auth/requires-recent-login") {
          console.error("Account creation timed out: ", error.message);
          alert("Account creation timed out. Please try logging in again.");
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
            connected_penpals_count: 0
        });

      setShowCreate(false);

      // Redirect to profile page or any other page as needed
      // router.push("/profile");
    } catch (error) {
      Sentry.captureException(error); //need to add password checks for size, and etc to make this defualt
      Sentry.captureException(error);
      console.error("Error creating account:", error);
      alert(error.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4 relative">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md relative min-h-[80vh]">
        <div className="flex items-center justify-between mb-4">
          <svg
            onClick={() => window.history.back()}
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 cursor-pointer"
            fill="none"
            viewBox="0 0 24 24"
            stroke="black">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
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
                label= "First name"
                id="first-name"
                placeholder="Ex: Jane"
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              
            </div>
            <div className="w-1/2">
              <Input
                label="Last Name"
                id="last-name"
                placeholder="Ex: Doe"
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
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
              required
              value={email}
            />
          </div>
              <div>
                
                <Input
                  id="password"
                  name="password"
                  type="password"
                  label="New Password"
                  autoComplete="new-password"
                  required
                  
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setShowPasswordChecklist(e.target.value.length > 0);
                  }}
                />
              </div>
              {showPasswordChecklist && (
                <PasswordChecklist
                  rules={["minLength", "specialChar", "number", "capital", "match"]}
                  minLength={8}
                  value={password}
                  valueAgain={repeatPassword}
                  onChange={(isValid) => {}}
                  className="text-black"
                />
              )}
              <div>
                <Input
                  id="repeat-password"
                  name="repeatPassword"
                  type="password"
                  label="Repeat Password"
                  required
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
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
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                See the <Link href="/terms-conditions" className="underline">terms and conditions</Link> and <Link className="underline" href="privacy-policy">privacy policy</Link>
                </label>
              </div>

              <div className="flex justify-center">
                <Button
                  btnType="submit"
                  btnText="Create Account"
                  color="green"
                />
              </div>
            </form>
          
        {/* <EditProfileImage router={router} /> */}
      </div>
    </div>
  );
}
