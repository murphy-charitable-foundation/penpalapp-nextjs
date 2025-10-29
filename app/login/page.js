"use client";

import { useState, useEffect } from "react";
import {browserSessionPersistence, setPersistence, signInWithEmailAndPassword, signOut} from "firebase/auth";
import { db, auth } from "../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import Link from "next/link";
import Image from "next/image";
import logo from "/public/murphylogo.png";
import { useRouter } from "next/navigation";
import Button from "../../components/general/Button";
import Input from "../../components/general/Input";
import { BackButton } from "../../components/general/BackButton";
import { PageContainer } from "../../components/general/PageContainer";
import { PageHeader } from "../../components/general/PageHeader";
import LoadingSpinner from "../../components/loading/LoadingSpinner";
import { usePageAnalytics } from "../useAnalytics";
import {
  logInEvent,
  logButtonEvent,
  logLoadingTime,
} from "../utils/analytics";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const isFormFilled = email && password;
  const router = useRouter();
  
  usePageAnalytics(`/login`);


  const redirectBasedOnUserType = async (uid) => {
    try {
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists() && userSnap.data().user_type === "local_volunteer") {
            router.push("/children-gallery");
        } else if (userSnap.exists()) {
            router.push("/letterhome");
        } else {
          await signOut(auth);
          setError("Please log in as a Local Volunteer.");
          setLoading(false);
        }
    } catch (err) {
        console.error("Error fetching user data:", err.message);
        setError("Failed to redirect. Please try again.");
        setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
        if (user) {
            await redirectBasedOnUserType(user.uid);
        } else {
            setLoading(false);
        }
    });
    return () => unsubscribe();
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    logButtonEvent("login button clicked", "/login");

    try {
      await setPersistence(auth, browserSessionPersistence);
      await signInWithEmailAndPassword(auth, email, password);
      await localStorage.removeItem('child');
      await redirectBasedOnUserType(auth.currentUser.uid);
    } catch (error) {
        console.error("Authentication error:", error.message);
        const message = "There was an error"///errorMessages[error.code] || errorMessages.default;
        setError(message);
        if (error.code === "auth/too-many-requests") {
            setShowModal(true);
        }
    }
  };


  const handleInputChange = () => {
    setError("");
  };

  if (loading) {
    return <LoadingSpinner/>;
  }

  return (
    <PageContainer maxWidth="md" padding="p-8">
      {loading && <LoadingSpinner />}
      <PageHeader title="Login" />
      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <div>
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
            error={error && error.toLowerCase().includes("email") ? error : ""}
          />
        </div>

        <div>
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
              error && error.toLowerCase().includes("password") ? error : ""
            }
          />
        </div>

        <div className="text-sm text-center">
          <Link
            href="/reset-password"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Forgot your password?
          </Link>
        </div>

        <div className="flex justify-center space-x-4"></div>

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
            Remember me
          </label>
        </div>

        {error &&
          !error.toLowerCase().includes("email") &&
          !error.toLowerCase().includes("password") && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}

        <div className="flex justify-center">
          <Button
            btnType="submit"
            btnText="Log in"
            color="green"
            textColor="text-white"
            disabled={loading}
          />
        </div>
      </form>
    </PageContainer>
  );
}
