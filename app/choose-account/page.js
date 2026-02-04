"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
import { useCachedUsers } from "../contexts/CachedUserContext";
import LoadingSpinner from "../../components/loading/LoadingSpinner";

function normalizeUser(u) {
  return {
    id: u.id,
    email: u.email,
    first_name: u.first_name ?? u.name ?? "",
    last_name: u.last_name ?? "",
    photo_uri: u.photo_uri ?? u.photoURL ?? "",
  };
}

export default function ChooseAccountPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [passwordInput, setPasswordInput] = useState("");

  const router = useRouter();
  const { cachedUsers, hydrated } = useCachedUsers();

  const users = (cachedUsers ?? []).map(normalizeUser);

  useEffect(() => {
    if (!hydrated) return;
    if (!users.length) {
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
      if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
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

  const openModal = (user) => {
    setSelectedUser(user);
    setPasswordInput("");
    setError("");
  };

  const closeModal = () => {
    setSelectedUser(null);
    setPasswordInput("");
    setError("");
  };

  if (isLoading) return <LoadingSpinner />;

  const modalContent = selectedUser ? (
    <div className="space-y-4">
      <div className="flex justify-center">
        <div className="h-20 w-20 rounded-full overflow-hidden bg-gray-100">
          <ProfileImage
            photo_uri={selectedUser.photo_uri}
            first_name={selectedUser.first_name}
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
        <PageHeader title="Choose account" showBackButton={false} />
        <p className="text-gray-600 text-sm text-center -mt-2 mb-6">
          Choose an account to continue
        </p>

        <div className="grid grid-cols-2 gap-4">
          {users.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => openModal(user)}
              className="bg-white rounded-lg p-4 shadow-md border border-gray-200 flex flex-col items-center hover:shadow-lg transition focus:outline-none focus:ring-2 focus:ring-dark-green focus:ring-offset-2"
            >
              <div className="h-20 w-20 rounded-full overflow-hidden bg-gray-100">
                <ProfileImage
                  photo_uri={user.photo_uri}
                  first_name={user.first_name}
                  size={20}
                />
              </div>
              <p className="mt-3 font-semibold text-gray-900 text-sm text-center line-clamp-2">
                {user.first_name} {user.last_name}
              </p>
              <span className="text-xs text-gray-500 mt-1">
                Tap to sign in
              </span>
            </button>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/login?force=1"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Use a different account
          </Link>
        </div>
      </PageContainer>

      <Dialog
        isOpen={!!selectedUser}
        onClose={closeModal}
        title={selectedUser ? `${selectedUser.first_name} ${selectedUser.last_name}` : ""}
        content={modalContent}
        width="default"
      />
    </PageBackground>
  );
}
