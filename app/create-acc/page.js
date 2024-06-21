"use client";

// pages/create-acc.js
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import Link from "next/link";
import Image from "next/image";
import { updatePassword, signOut } from "firebase/auth";
import { handleLogout } from "../profile/page";
import * as Sentry from "@sentry/nextjs";

export default function CreateAccount() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [birthday, setBirthday] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== repeatPassword) {
        alert("Passwords do not match.");
        return;
    }
    try {
        const user = auth.currentUser;
        const uid = user.uid;
        try {
            await updatePassword(user, password);
        }
        catch (error) {
            if (error.code == 'auth/requires-recent-login') {
                console.error("Account creation timed out: ", error.message);
                alert("Account creation timed out. Please try logging in again.");
                await signOut(auth);
                router.push('/login');
                return
            }
            else {
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
            connected_penpals_count: 0
        });

        // Redirect to profile page or any other page as needed
        router.push('/profile'); 
    } catch (error) {
      Sentry.captureException(error);  //need to add password checks for size, and etc to make this defualt
      console.error("Error creating account:", error);
      alert(error.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <svg
            onClick={() => window.history.back()}
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 cursor-pointer"
            fill="none"
            viewBox="0 0 24 24"
            stroke="black"
          >
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
          <div className="h-6 w-6"></div>
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
              <label
                htmlFor="first-name"
                className="text-sm font-medium text-gray-700 block mb-2"
              >
                First name
              </label>
              <input
                id="first-name"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div className="w-1/2">
              <label
                htmlFor="last-name"
                className="text-sm font-medium text-gray-700 block mb-2"
              >
                Last name
              </label>
              <input
                id="last-name"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="birthday"
              className="text-sm font-medium text-gray-700 block mb-2"
            >
              Birthday
            </label>
            <input
              id="birthday"
              type="date"
              className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="text-sm font-medium text-gray-700 block mb-2"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="text-sm font-medium text-gray-700 block mb-2"
            >
              New Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <label
              htmlFor="repeat-password"
              className="text-sm font-medium text-gray-700 block mb-2"
            >
              Repeat Password
            </label>
            <input
              id="repeat-password"
              name="repeatPassword"
              type="password"
              required
              className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              value={repeatPassword}
              onChange={(e) => setRepeatPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            style={{
              padding: "10px 20px",
              width: "80%",
              margin: "50px auto",
              display: "block",
              backgroundColor: "#48801c",
              color: "white",
              border: "none",
              borderRadius: "20px",
              cursor: "pointer",
            }}
          >
            Create Account
          </button>
        </form>
      </div>
    </div>
  );
}
