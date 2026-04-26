"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { db, auth } from "../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

import Link from "next/link";
import { useCachedUsers } from "../contexts/CachedUserContext";
import Image from "next/image";
import logo from "/public/murphylogo.png";

import { useRouter } from "next/navigation";

import Button from "../../components/general/Button";
import Input from "../../components/general/Input";
import { PageContainer } from "../../components/general/PageContainer";
import { PageHeader } from "../../components/general/PageHeader";
import LoadingSpinner from "../../components/loading/LoadingSpinner";
import { PageBackground } from "../../components/general/PageBackground";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { setCachedUsers } = useCachedUsers();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!email) throw new Error("Please enter your email.");
      if (!password) throw new Error("Please enter your password.");

      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const uid = userCredential.user.uid;

      // ✅ Cache user locally
      const existingUsers =
        JSON.parse(localStorage.getItem("cachedUsers")) || [];

      const newUser = {
        id: auth.currentUser?.uid || userCredential.user.uid,
        email:
          auth.currentUser?.email ||
          userCredential.user.email ||
          email,
        first_name:
          auth.currentUser?.displayName ||
          userCredential.user.displayName ||
          "",
        photo_uri:
          auth.currentUser?.photoURL ||
          userCredential.user.photoURL ||
          "",
      };

      const updatedUsers = [
        ...existingUsers.filter(
          (u) => u.email !== newUser.email && u.id !== newUser.id
        ),
        newUser,
      ];

      setCachedUsers(updatedUsers);
      localStorage.setItem("cachedUsers", JSON.stringify(updatedUsers));

      // 🔁 Existing routing logic
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        if (userSnap.data().user_type === "admin") {
          router.push("/admin");
        } else {
          router.push("/letterhome");
        }
      } else {
        router.push("/create-acc");
      }
    } catch (err) {
      setLoading(false);
      console.error("Authentication error:", err.message);

      switch (err.code) {
        case "auth/user-not-found":
          setError("No user found with this email.");
          break;
        case "auth/wrong-password":
          setError("Wrong password.");
          break;
        case "auth/too-many-requests":
          setError("Too many attempts. Try again later.");
          break;
        default: {
          if (!err.code) setError(err.message);
          else setError("Failed to log in.");
        }
      }
    }
  };

  const handleInputChange = () => setError("");

  const handleForgotPassword = () => {
    router.push("/reset-password");
  };

  return (
    <PageBackground>
      <PageContainer>
        <div className="px-6 py-8">
          {loading && <LoadingSpinner />}

          <PageHeader title="Login" />

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <Input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                handleInputChange();
              }}
              placeholder="Ex. user@gmail.com"
              id="email"
              name="email"
              label="Email"
              error={
                error && error.toLowerCase().includes("email")
                  ? error
                  : ""
              }
            />

            <Input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                handleInputChange();
              }}
              placeholder="******"
              id="password"
              name="password"
              label="Password"
              error={
                error && error.toLowerCase().includes("password")
                  ? error
                  : ""
              }
            />

            {/* Forgot password */}
            <div className="block text-md text-center">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Forgot your password?
              </button>
            </div>

            {/* Other errors */}
            {error &&
              !error.toLowerCase().includes("email") &&
              !error.toLowerCase().includes("password") && (
                <p className="text-red-500 text-sm text-center">
                  {error}
                </p>
              )}

            <div className="flex justify-center pt-2">
              <Button
                btnType="submit"
                btnText="Log in"
                color="green"
                disabled={loading}
              />
            </div>
          </form>
        </div>
      </PageContainer>
    </PageBackground>
  );
}