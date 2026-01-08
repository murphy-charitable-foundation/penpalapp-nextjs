"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebaseConfig";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "../../components/general/Button";
import Input from "../../components/general/Input";
import { PageContainer } from "../../components/general/PageContainer";
import { PageHeader } from "../../components/general/PageHeader";
import LoadingSpinner from "../../components/loading/LoadingSpinner";
import { usePageAnalytics } from "../useAnalytics";
import { logButtonEvent } from "../utils/analytics";
import { getUserDoc } from "../utils/letterboxFunctions";
import { useUserData } from "../../context/UserDataContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { setUserData } = useUserData();

  usePageAnalytics("/login");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    logButtonEvent("login button clicked", "/login");

    try {
      if (!email) throw new Error("Please enter your email.");
      if (!password) throw new Error("Please enter your password.");

      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const uid = userCredential.user.uid;
      const { userDocSnapshot } = await getUserDoc(uid);

      if (userDocSnapshot?.exists()) {
        setUserData(userDocSnapshot.data());
        router.push("/letterhome");
      } else {
        router.push("/create-acc");
      }
    } catch (error) {
      setLoading(false);
      console.error("Authentication error:", error.message);

      switch (error.code) {
        case "auth/user-not-found":
          setError("No user found with this email.");
          break;
        case "auth/wrong-password":
          setError("Wrong password.");
          break;
        case "auth/too-many-requests":
          setError("Too many attempts. Try again later.");
          break;
        default:
          setError(error.message || "Failed to log in.");
      }
    }
  };

  const handleInputChange = () => {
    setError("");
  };

  return (
    <PageContainer maxWidth="md" padding="p-8">
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
          error={error.toLowerCase().includes("email") ? error : ""}
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
          error={error.toLowerCase().includes("password") ? error : ""}
        />

        <div className="text-sm text-center">
          <Link
            href="/reset-password"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Forgot your password?
          </Link>
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
