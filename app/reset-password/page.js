"use client";

{
  /* pages/reset-password.js */
}
import { db, auth } from "../firebaseConfig";
import { useState } from "react";
import { useRouter } from "next/navigation";
import logo from "/public/murphylogo.png";
import Image from "next/image";
import { sendPasswordResetEmail } from "firebase/auth";
import Button from "../../components/general/Button";
import Input from "../../components/general/Input";
import Dialog from "../../components/general/Dialog";
import { PageHeader } from "../../components/general/PageHeader";
import { PageBackground } from "../../components/general/PageBackground";
import { PageContainer } from "../../components/general/PageContainer";
import { usePageAnalytics } from "../useAnalytics";
import { logButtonEvent, logLoadingTime } from "../utils/analytics";
import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [errors, setErrors] = useState({});

  const router = useRouter();
  usePageAnalytics("/reset-password");

  function resetPassword() {
    const newErrors = {};
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Invalid email format";
    }
    try {
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        throw new Error("Form validation error(s)");
      }
      sendPasswordResetEmail(auth, email)
        .then(() => {
          setShowModal(true);
        })
        .catch((error) => {
          console.error(error);
        });
    } catch (error) {
      logError(error, { description: "Error resetting password:", error});
    }

    logButtonEvent("Reset Password clicked!", "/reset-password");
  }

  function closeModal() {
    setShowModal(false);
    router.push("/login");
  }

  const modalContent = (
    <div>
      <p style={{ color: "black", marginTop: "20px", fontSize: "0.9rem" }}>
        Please check your email inbox and spam folder for a verification email
        to reset your password.
      </p>
      <div className="flex justify-center mt-4">
        <Button onClick={closeModal} btnText="Understood" color="green" />
      </div>
    </div>
  );

return (
  <PageBackground className="bg-gray-100 h-screen flex flex-col overflow-hidden">
    {/* ===== MAIN AREA ===== */}
    <div className="flex-1 min-h-0 flex justify-center">

      <PageContainer
        width="compactXS"
        padding="none"
        center={false}
        className="
          min-h-[100dvh]
          flex flex-col
          bg-white
          rounded-2xl
          shadow-lg
          overflow-hidden
        "
      >
        {/* ===== HEADER ===== */}
        <PageHeader title="Reset Your Password" image></PageHeader>

        {/* ===== CONTENT (SCROLLABLE – CONSISTENT) ===== */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 py-6">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Ex: user@gmail.com"
            name="email"
            id="email"
            required
            label="Registered Email"
            error={errors.email || ""}
          />

          <div className="mt-8 flex justify-center">
            <Button
              btnType="button"
              btnText="Reset"
              color="gray"
              textColor="text-gray-400"
              size="default"
              onClick={resetPassword}
              rounded="rounded-full"
            />
          </div>
        </div>
      </PageContainer>
    </div>

    {/* ===== DIALOG ===== */}
    <Dialog
      isOpen={showModal}
      width="large"
      onClose={() => setShowModal(false)}
      title="Please Check Your Email"
      content={modalContent}
    />
  </PageBackground>
);

}