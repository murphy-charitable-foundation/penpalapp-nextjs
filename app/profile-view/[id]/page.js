"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "../../firebaseConfig";

import { PageContainer } from "../../../components/general/PageContainer";
import { PageHeader } from "../../../components/general/PageHeader";
import ProfileSection from "../../../components/general/profile/ProfileSection";
import InfoDisplay from "../../../components/general/profile/InfoDisplay";
import NavBar from "../../../components/bottom-nav-bar";
import { PageBackground } from "../../../components/general/PageBackground";


export default function Page({ params }) {
  const { id } = params;

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [country, setCountry] = useState("");
  const [village, setVillage] = useState("");
  const [bio, setBio] = useState("");
  const [educationLevel, setEducationLevel] = useState("");
  const [isOrphan, setIsOrphan] = useState("");
  const [guardian, setGuardian] = useState("");
  const [dreamJob, setDreamJob] = useState("");
  const [hobby, setHobby] = useState("");
  const [favoriteColor, setFavoriteColor] = useState("");
  const [photoUri, setPhotoUri] = useState("");
  const [userType, setUserType] = useState("international_buddy");

  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      const docRef = doc(db, "users", id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const u = docSnap.data();
        setFirstName(u.first_name || "");
        setLastName(u.last_name || "");
        setBirthday(u.birthday || "");
        setCountry(u.country || "");
        setVillage(u.village || "");
        setBio(u.bio || "");
        setEducationLevel(u.education_level || "");
        setIsOrphan(u.is_orphan ? "Yes" : "No");
        setGuardian(u.guardian || "");
        setDreamJob(u.dream_job || "");
        setHobby(u.hobby || "");
        setFavoriteColor(u.favorite_color || "");
        setPhotoUri(u.photo_uri || "");
        setUserType(u.user_type || "");
      }
    };
    fetchUserData();
  }, [id]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) router.push("/login");
    });
    return () => unsubscribe();
  }, []);

return (
  <PageBackground className="bg-gray-100 h-screen flex flex-col overflow-hidden">
    <div className="flex-1 min-h-0 flex justify-center">

      <PageContainer
        width="compactXS"
        padding="none"
        center={false}
        className="min-h-[100dvh] flex flex-col bg-white rounded-2xl shadow-lg overflow-hidden"
      >
        {/* ===== HEADER ===== */}
        <PageHeader title="View Profile" image={false} />

        {/* ===== SCROLLABLE CONTENT (ONLY SCROLLER) ===== */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 py-5">
          
          {/* PROFILE IMAGE */}
          <div className="my-6">
            <div className="relative w-40 h-40 mx-auto">
              <Image
                src={photoUri || "/murphylogo.png"}
                fill
                alt="Profile photo"
                className="rounded-full object-cover"
              />
            </div>
          </div>

          {/* NAME / COUNTRY / BIO */}
          <div className="text-center space-y-2 mb-8">
            <h2 className="text-2xl font-bold">
              {firstName} {lastName}
            </h2>
            <p className="font-semibold">{country}</p>
            {bio && (
              <p className="text-gray-500 italic">“{bio}”</p>
            )}
          </div>

          {/* ===== SECTIONS ===== */}
          <div className="space-y-8 pl-4">

            <ProfileSection title="Personal Information">
              {userType !== "international_buddy" && (
                <InfoDisplay title="Village" info={village} />
              )}
              <InfoDisplay title="Birthday" info={birthday} />
            </ProfileSection>

            <ProfileSection title="Education & Family">
              <InfoDisplay
                title="Education Level"
                info={educationLevel}
              />
              {userType !== "international_buddy" && (
                <>
                  <InfoDisplay title="Guardian" info={guardian} />
                  <InfoDisplay title="Is Orphan" info={isOrphan} />
                </>
              )}
            </ProfileSection>

            <ProfileSection title="Interest">
              <InfoDisplay title="Dream Job" info={dreamJob} />
              <InfoDisplay title="Hobby" info={hobby} />
              <InfoDisplay title="Favorite Color" info={favoriteColor} />
            </ProfileSection>

          </div>
        </div>

        {/* ===== NAVBAR ===== */}
        <div className="shrink-0 border-t bg-blue-100 rounded-b-2xl">
          <NavBar />
        </div>

      </PageContainer>
    </div>
  </PageBackground>
);


}

