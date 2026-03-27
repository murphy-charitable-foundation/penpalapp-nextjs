"use client";

import { useState, useEffect } from "react";
import { PageBackground } from "../../components/general/PageBackground";
import { PageContainer } from "../../components/general/PageContainer";
import { useRouter } from "next/navigation";

import Button from "../../components/general/Button";
import { usePageAnalytics } from "../useAnalytics";
import { logButtonEvent } from "../utils/analytics";

export default function Welcome() {
  const [firstName, setFirstName] = useState("");
  const router = useRouter();

  usePageAnalytics("/welcome");

  useEffect(() => {
    const value = localStorage.getItem("userFirstName");

    if (value) {
      setFirstName(value);
    }
  }, []);

  return (
    <PageBackground className="min-h-screen !bg-primary">
      <PageContainer className="max-w-lg mx-auto text-white flex flex-col min-h-screen">
        <div className="min-h-screen !bg-[#034792]">
          <div className="max-w-lg mx-auto text-white flex flex-col min-h-screen">
            <div className="relative w-full h-[50vh] bg-[url('/welcome.png')] bg-cover bg-center" />

            <h3 className="pt-16 text-center w-full font-[700] text-2xl">
              Welcome, {firstName}
            </h3>

            <div className="text-center w-full pt-5 flex-1">
              We are so happy to be here, thanks for your support. Now you are
              part of the family.
            </div>

            <div className="text-center w-full pt-10 pb-20">
              <button
                className="bg-white text-[#111111] px-16 py-2 rounded-full font-semibold"
                onClick={() => {
                  logButtonEvent("Continue button clicked!", "/welcome");
                  router.push("/edit-profile-user-image");
                }}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      </PageContainer>
    </PageBackground>
  );
}
