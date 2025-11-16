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
export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  function resetPassword() {
    sendPasswordResetEmail(auth, email)
      .then(() => {
        setShowModal(true);
      })
      .catch((error) => {
        console.error(error);
      });
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
    <PageBackground>
      <PageContainer>
        <div className="p-0 bg-white">
          <PageHeader title="Reset Your Password" />
          <div className="mt-10">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ex: user@gmail.com"
              name="email"
              id="email"
              required
              label="Registered Email"
            />
          </div>

          <div className="mt-6 flex justify-center">
            <Button
              btnType="button"
              btnText="Reset"
              color="gray"
              textColor="text-gray-400"
              size="default"
              onClick={resetPassword}
            />
          </div>
        </div>
      </PageContainer>
      <Dialog
        isOpen={showModal}
        width="large"
        onClose={() => {
          setShowModal(false);
        }}
        title="Please Check Your Email"
        content={modalContent}
      />
    </PageBackground>
  );
}
