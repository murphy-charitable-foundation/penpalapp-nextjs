"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { db, auth } from "../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
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
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        router.push("/letterhome");
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
    <PageBackground className="bg-gray-100 h-screen overflow-hidden flex flex-col">
      <div className="flex-1 flex justify-center items-center px-4">
        <PageContainer
          width="compactXS"
          padding="none"
          center={false}
          className="w-full max-h-[100dvh] flex flex-col bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          {/* ===== HEADER ===== */}
          <div className="pb-4">
            <PageHeader title="Login" image showBackButton showBorder={false} />
          </div>

          {/* ===== CONTENT (ONLY SCROLLER) ===== */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-8">
            {loading && <LoadingSpinner />}

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
                error={error && error.toLowerCase().includes("email") ? error : ""}
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
                error={error && error.toLowerCase().includes("password") ? error : ""}
              />

              {/* ===== FORGOT PASSWORD BUTTON ===== */}
              <div className="block text-md text-center">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Forgot your password?
                </button>
              </div>

              {/* ===== OTHER ERRORS ===== */}
              {error &&
                !error.toLowerCase().includes("email") &&
                !error.toLowerCase().includes("password") && (
                  <p className="text-red-500 text-sm text-center">{error}</p>
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
      </div>
    </PageBackground>
  );
}
