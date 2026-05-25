"use client";

import PageBackground from "@/components/general/PageBackground";
import PageContainer from "@/components/general/PageContainer";
import AvatarUploadModal from "@/components/general/AvatarUploadModal";
import LoadingSpinner from "@/components/loading/LoadingSpinner";

import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { uploadFile } from "../utils/uploadFile";
import { useRouter } from "next/navigation";
import { useUser } from "@/contexts/UserContext";

export default function Page() {
  const { user } = useUser();
  const router = useRouter();
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // First name is derived from Firebase Auth displayName via UserContext
  const firstName = user?.displayName?.split(" ")[0] ?? "";

  const handleContinue = () => {
    setShowAvatarModal(true);
  };

  const handleSkip = () => {
    setShowAvatarModal(false);
    router.push("/profile");
  };

  const handleAvatarSelected = async (blob) => {
    if (!user?.uid) return;
    setIsUploading(true);
    setShowAvatarModal(false);
    

    uploadFile(
      blob,
      `profile/${user.uid}/profile-image`,
      () => {},
      (error) => {
        console.error("Profile image upload error", error);
        setIsUploading(false);
      },
      async (url) => {
        try {
          if (!url) {
            console.error("Profile image upload returned empty URL");
            setIsUploading(false);
            return;
          }
          await updateDoc(doc(db, "users", user.uid), { photo_uri: url });
        } catch (error) {
          console.error("Failed to update user photo_uri", error);
        } finally {
          setIsUploading(false);
          router.push("/profile");
        }
      }
    );
  };


  return (
    <PageBackground className="min-h-screen !bg-primary">
      {isUploading && <LoadingSpinner />}
      {showAvatarModal && (
        <AvatarUploadModal
          title="Upload a profile photo"
          autoSave={false}
          onContinue={handleAvatarSelected}
          onBackClick={handleSkip}
          onSkip={handleSkip}
          continueText="Save"
          skipText="Skip for now"
          pageAnalyticsPath="/welcome"
        />
      )}
      <PageContainer className="max-w-lg mx-auto text-white flex flex-col min-h-screen">
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
      </PageContainer>
    </PageBackground>
  );
}