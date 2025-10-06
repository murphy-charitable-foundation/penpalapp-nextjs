"use client";

// pages/change-password.js
import { db, auth } from "../firebaseConfig";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import logo from "/public/murphylogo.png";
import Image from "next/image";
//import { sendPasswordResetEmail } from 'firebase/auth';
import { updatePassword, signOut } from "firebase/auth";
//import { handleLogout } from '../profile/page';
import PasswordChecklist from "react-password-checklist";
import Modal from "../../components/general/Modal";
import Button from "../../components/general/Button";
import Input from "../../components/general/Input";
import { PageContainer } from "../../components/general/PageContainer";
import { BackButton } from "../../components/general/BackButton";
import { PageHeader } from "../../components/general/PageHeader";
import { PageBackground } from "../../components/general/PageBackground";
import { logButtonEvent, logError } from "../utils/analytics";
import { usePageAnalytics } from "../useAnalytics";

export default function ChangePassword() {
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isValidPassword, setisValidPassword] = useState(false);
  const router = useRouter();

  usePageAnalytics("/change-password");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const user = auth.currentUser;
      const uid = user.uid;
      await updatePassword(user, password);
      setShowModal(true);
    } catch (error) {
      logError(error, {
        description: "Error changing password: ",
      });
      if (error.code === "auth/requires-recent-login") {
        setError(
          "For security, please sign in again before changing your password"
        );
        router.push("/login");
      } else if (error.code === "auth/weak-password") {
        setError("Please choose a stronger password");
      } else if (error.code === "auth/user-disabled") {
        setError("This account has been disabled. Please contact support.");
      } else {
        setError("An unexpected error occurred. Please try again later.");
      }
    }
  };

  const modalContent = (
    <div className="space-y-4">
      <p className="text-black text-center mt-[20px]">
        Your password has been reset. Please sign in to your account again.
      </p>
      <div className="flex justify-center">
        <Button onClick={closeModal} color="green" btnText="Understood" />
      </div>
    </div>
  );

  function closeModal() {
    setShowModal(false);
    router.push("/login");
  }

  return (
    <>
      <PageBackground>
        <PageContainer maxWidth="lg">
          <BackButton />
          <div className="max-w-lg mx-auto  rounded-lg overflow-hidden">
            <PageHeader title="Create Your New Password" />

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="text-left mt-20">
                <Input
                  id="password"
                  name="password"
                  type="password"
                  label="New Password"
                  placeholder="*******"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="text-left mt-10">
                <Input
                  id="repeat-passwod"
                  name="repeatPassword"
                  type="password"
                  placeholder="*******"
                  label="Verified a new Password"
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                />
              </div>

              <div className="text-left text-sm text-red-600">
                <PasswordChecklist
                  rules={[
                    "minLength",
                    "specialChar",
                    "number",
                    "capital",
                    "lowercase",
                    "match",
                  ]}
                  minLength={7}
                  value={password}
                  valueAgain={repeatPassword}
                  messages={{
                    minLength: "Must be at least 7 characters.",
                    specialChar: "Must contain at least 1 special character.",
                    number: "Must contain at least 1 number.",
                    capital: "Must contain at least 1 uppercase letter.",
                    lowercase: "Must contain at least 1 lowercase letter.",
                    match: "Passwords do not match.",
                  }}
                  onChange={(isValid, failedRules) => {
                    setisValidPassword(isValid);
                  }}
                />
              </div>

              <div>
                <div className="flex justify-center">
                  <Button
                    btnType="submit"
                    btnText="Done"
                    color="gray"
                    textColor="gray"
                    size="large"
                    disabled={!isValidPassword}
                    onClick={() =>
                      logButtonEvent(
                        "Change password button clicked",
                        "/change-password"
                      )
                    }
                  />
                </div>
              </div>
            </form>
          </div>
          <Modal
            isOpen={showModal}
            onClose={() => {
              setShowModal(false);
            }}
            title="Password reset was successful!"
            content={modalContent}
            width="large"
          />
        </PageContainer>
      </PageBackground>
    </>
  );
}
