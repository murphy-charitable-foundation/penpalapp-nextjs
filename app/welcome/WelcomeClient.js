"use client";

import { useRouter } from "next/navigation";
import { useUser } from "@/contexts/UserContext";
// app/welcome/WelcomeClient.js

export default function WelcomeClient() {
  const { user } = useUser();
  const router = useRouter();

  // First name is derived from Firebase Auth displayName via UserContext
  const firstName = user?.displayName?.split(" ")[0] ?? "";

  const handleContinue = () => {
    router.push("/onboarding-avatar");
  };

  return (
    <div className="min-h-screen bg-[#034792] flex flex-col max-w-lg mx-auto">
      {/* Hero image */}
      <div
        className="w-full h-[50vh] bg-cover bg-center flex-shrink-0"
        style={{ backgroundImage: "url('/welcome.png')" }}
        role="img"
        aria-label="Community photo"
      />

      {/* Content */}
      <div className="flex flex-col flex-1 text-white px-6">
        <h1 className="pt-16 text-center font-bold text-2xl">
          Welcome{firstName ? `, ${firstName}` : ""}
        </h1>

        <p className="text-center pt-5 flex-1 leading-relaxed opacity-90">
          We are so happy to be here, thanks for your support. Now you are part
          of the family.
        </p>

        {/* CTA */}
        <div className="text-center pt-10 pb-20">
          <button
            type="button"
            onClick={handleContinue}
            className="bg-white text-[#111111] px-16 py-2 rounded-full font-semibold hover:bg-opacity-90 transition-opacity"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
