"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { db, auth } from "../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";

import Button from "../../components/general/Button";
import Input from "../../components/general/Input";
import { PageContainer } from "../../components/general/PageContainer";
import { PageHeader } from "../../components/general/PageHeader";
import LoadingSpinner from "../../components/loading/LoadingSpinner";
import { PageBackground } from "../../components/general/PageBackground";

const TOP_GAP = 6;
const GAP_BELOW = 4;

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
        default: {
          if (!error.code) setError(error.message);
          else setError("Failed to log in.");
        }
      }
    }
  };

  const handleInputChange = () => setError("");

  return (
    <PageBackground className="bg-gray-100 min-h-[100dvh] overflow-hidden flex flex-col ">
      <div className="flex-1 min-h-0" style={{ paddingTop: TOP_GAP }}>
        <div
          className="relative mx-auto w-full max-w-[29rem] rounded-2xl shadow-lg overflow-hidden flex flex-col min-h-0"
          style={{
            height: `calc(100dvh - ${TOP_GAP}px - ${GAP_BELOW}px - env(safe-area-inset-bottom,0px))`,
          }}
        >
          <PageContainer
            width="compaxtXS"
            padding="none"
            bg="bg-white"
            scroll={false}
            viewportOffset={0}
            className="p-0 flex-1 min-h-0 flex flex-col overflow-hidden px-8 py-8"
          >
            <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
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
                    error={
                      error && error.toLowerCase().includes("email")
                        ? error
                        : ""
                    }
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
                      error && error.toLowerCase().includes("password")
                        ? error
                        : ""
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

                <div className="flex items-center justify-center">
                  <input
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
                    <div className="text-red-500 text-sm text-center">
                      {error}
                    </div>
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
            </div>
          </PageContainer>
        </div>
      </div>
    </PageBackground>
  );
}
