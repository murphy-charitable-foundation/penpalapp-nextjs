"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebaseConfig";
import AvatarUploadModal from "@/components/AvatarUploadModal";
import PageBackground from "@/components/general/PageBackground";
import PageContainer from "@/components/general/PageContainer";

export default function OnboardingAvatar() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Redirect to login if unauthenticated ─────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
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
    <PageBackground className="min-h-screen !bg-primary">
      <PageContainer className="max-w-lg mx-auto text-white flex flex-col min-h-screen">
        <AvatarUploadModal
          title="Add a profile avatar"
          continueText="Continue"
          skipText="Skip for now"
          onBackClick={() => router.back()}
          onContinue={() => router.push("/onboarding-location")}
          onSkip={() => router.push("/onboarding-location")}
          circleBgColor="bg-[#4E802A]"
          primaryColor="#4E802A"
          primaryColorBg="bg-[#4E802A]"
          primaryColorDark="#034792"
          pageAnalyticsPath="/onboarding-avatar"
        />
      </PageContainer>
    </PageBackground>
  );
}
