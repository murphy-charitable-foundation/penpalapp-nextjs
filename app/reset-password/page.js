"use client";

import { auth } from "../firebaseConfig";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendPasswordResetEmail } from "firebase/auth";
import Button from "../../components/general/Button";
import Input from "../../components/general/Input";
import Dialog from "../../components/general/Dialog";
import { PageHeader } from "../../components/general/PageHeader";
import { PageBackground } from "../../components/general/PageBackground";
import { PageContainer } from "../../components/general/PageContainer";
import { usePageAnalytics } from "../useAnalytics";
import { logButtonEvent, logError } from "../utils/analytics";

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

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    sendPasswordResetEmail(auth, email)
      .then(() => setShowModal(true))
      .catch((error) => logError(error));

    logButtonEvent("reset_password_submit", "/reset-password");
  }

  function closeModal() {
    setShowModal(false);
    router.push("/login");
  }

  const modalContent = (
    <div>
      <p className="text-black mt-5 text-sm">
        Please check your email inbox and spam folder for a verification email to
        reset your password.
      </p>
      <div className="flex justify-center mt-4">
        <Button onClick={closeModal} btnText="Understood" color="green" />
      </div>
    </div>
  );

  return (
    <PageBackground>
      <PageContainer maxWidth="lg">
        <div className="p-0 bg-white">
          <PageHeader title="Reset Your Password" />

          <form
            method="post"
            onSubmit={(e) => {
              e.preventDefault();
              resetPassword();
            }}
          >
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

            <div className="mt-6 flex justify-center">
              <Button btnType="submit" btnText="Reset" color="gray" />
            </div>
          </form>
        </div>
      </PageContainer>

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
