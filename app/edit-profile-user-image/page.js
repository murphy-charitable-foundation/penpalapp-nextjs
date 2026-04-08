"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import AvatarUploadModal from "@/components/AvatarUploadModal";
import PageBackground from "@/components/general/PageBackground";
import PageContainer from "@/components/general/PageContainer";
import { usePageAnalytics } from "../useAnalytics";

export default function EditProfileUserImage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  usePageAnalytics("/edit-profile-user-image");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setLoading(false);
      } else {
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return null;
  }

  return (
    <PageBackground className="min-h-screen bg-gray-50">
      <PageContainer className="max-w-lg mx-auto flex flex-col min-h-screen">
        <AvatarUploadModal
          title="Update your profile picture"
          continueText="Save Profile Picture"
          skipText={null}
          onBackClick={() => router.push("/profile")}
          onContinue={() => router.push("/profile")}
          showBackButton={true}
          pageAnalyticsPath="/edit-profile-user-image"
        />
      </PageContainer>
    </PageBackground>
  );
}
