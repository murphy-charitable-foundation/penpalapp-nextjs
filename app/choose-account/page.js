//choose-account/page.js

"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebaseConfig";
import ProfileImage from "../../components/general/ProfileImage";
import Button from "../../components/general/Button";
import Input from "../../components/general/Input";
import Dialog from "../../components/general/Dialog";
import { PageBackground } from "../../components/general/PageBackground";
import { PageContainer } from "../../components/general/PageContainer";
import { PageHeader } from "../../components/general/PageHeader";
import { useCachedUserLogins } from "../contexts/CachedUserLoginContext";
import LoadingSpinner from "../../components/loading/LoadingSpinner";

export default function ChooseAccountPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [passwordInput, setPasswordInput] = useState("");

  const router = useRouter();

  const {
    cachedUserLogins,
    hydrated,
    clearAllCachedUserLogins,
    removeCachedUserLogin,
  } = useCachedUserLogins();

  const hasRedirected = useRef(false);
  const users = cachedUserLogins ?? [];

  useEffect(() => {
    if (!hydrated) return;

    if (users.length === 0) {
      if (hasRedirected.current) return;
      hasRedirected.current = true;
      router.replace("/login");
      return;
    }

    setIsLoading(false);
  }, [hydrated, users.length, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser?.email || !passwordInput.trim()) return;

    setError("");
    setSigningIn(true);

    try {
      await signInWithEmailAndPassword(auth, selectedUser.email, passwordInput);
      setSelectedUser(null);
      setPasswordInput("");
      router.push("/letterhome");
    } catch (err) {
      console.error(err);

      if (
        err.code === "auth/wrong-password" ||
        err.code === "auth/invalid-credential"
      ) {
        setError("Incorrect password. Please try again.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many attempts. Try again later.");
      } else {
        setError("Could not sign in. Please try again.");
      }

      setPasswordInput("");
    } finally {
      setSigningIn(false);
    }
  };

  const openModal = (user, dialogType = "signIn") => {
    setSelectedUser({ ...user, dialogType });
    setPasswordInput("");
    setError("");
  };

  const closeModal = () => {
    setSelectedUser(null);
    setPasswordInput("");
    setError("");
  };

  const handleDeleteUser = (id) => {
    removeCachedUserLogin(id);
  };

  if (isLoading) return <LoadingSpinner />;

  const modalContent =
    selectedUser?.dialogType === "signIn" ? (
      <div className="space-y-4">
        <div className="flex justify-center">
          <div className="h-20 w-20 rounded-full overflow-hidden bg-gray-100">
            <ProfileImage
              photo_uri={selectedUser.photo_uri}
              name={selectedUser.name}
              size={20}
            />
          </div>
        </div>

        <p className="text-sm text-gray-600 text-center">
          Enter your password to continue
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            placeholder="******"
            id="password"
            name="password"
            label="Password"
            error={error || undefined}
            required
          />

          <div className="flex justify-center">
            <Button
              color="green"
              btnText={signingIn ? "Signing in…" : "Sign in"}
              btnType="submit"
              disabled={signingIn}
            />
          </div>
        </form>
      </div>
    ) : null;

  return (
    <PageBackground>
      <PageContainer maxWidth="md">
        <PageHeader
          title="Choose Account"
          subtitle="Select a profile to sign in"
          showBorder={false}
        />

        <div className="grid grid-cols-2 gap-4 px-6 mt-3">
          {users.map((user) => (
            <div key={user.id} className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openModal(user, "delete");
                }}
                className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-white shadow text-gray-400 hover:text-red-500"
              >
                ✕
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openModal(user, "signIn")
                }}
                className="bg-white rounded-lg p-4 shadow-md border border-gray-200 flex flex-col items-center hover:shadow-lg transition focus:outline-none focus:ring-2 focus:ring-dark-green focus:ring-offset-2 w-full"
              >
                <div className="h-20 w-20 rounded-full overflow-hidden bg-gray-100">
                  <ProfileImage
                    photo_uri={user.photo_uri}
                    name={user.name}
                    size={20}
                  />
                </div>

                <p className="mt-3 font-semibold text-gray-900 text-sm text-center line-clamp-2">
                  {user.name}
                </p>

                <span className="text-xs text-gray-500 mt-1">
                  Tap to sign in
                </span>
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={() => router.push("/login?force=1")}
            className="bg-white rounded-lg p-4 shadow-md border border-gray-200 flex flex-col items-center hover:shadow-lg transition focus:outline-none focus:ring-2 focus:ring-dark-green focus:ring-offset-2 w-full"
          >
            <div className="h-20 w-20 rounded-full border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center">
              <span className="text-6xl font-light text-gray-400 leading-none -mt-1">
                +
              </span>
            </div>

            <p className="mt-3 font-semibold text-gray-900 text-sm text-center line-clamp-2">
              Add a different profile
            </p>

            <span className="text-xs text-gray-500 mt-1">
              Tap to add
            </span>
          </button>
        </div>

        <div className="mt-8 text-center space-y-3">
          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/reset-password")}
              className="text-sm text-blue-600 hover:text-blue-500 underline"
            >
              Forgot password?
            </button>
          </div>
        </div>
      </PageContainer>

      <Dialog
        isOpen={!!selectedUser}
        onClose={closeModal}
        title={
          selectedUser?.dialogType === "delete"
            ? "Remove profile?"
            : selectedUser?.name ?? ""
        }
        content={
          selectedUser?.dialogType === "delete" ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-gray-600">
                {`Are you sure you want to remove the profile of ${
                  selectedUser?.name ?? ""
                }?`}
              </p>

              <div className="flex justify-center gap-3">
                <Button
                  color="gray"
                  btnText="Cancel"
                  onClick={closeModal}
                />

                <Button
                  color="red"
                  btnText="Remove"
                  onClick={() => {
                    handleDeleteUser(selectedUser.id);
                    closeModal();
                  }}
                />
              </div>
            </div>
          ) : (
            modalContent
          )
        }
        width="default"
      />
    </PageBackground>
  );
}