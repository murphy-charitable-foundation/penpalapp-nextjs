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
import ArrayDisplay from "../../../components/general/profile/ArrayDisplay";
import NavBar from "../../../components/bottom-nav-bar";
import { PageBackground } from "../../../components/general/PageBackground";
import { set } from "nprogress";

/* ❗ If you add new fields to the user profile, update this file as well as the edit profile page, pages/createChild API, and user-data-import page */

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
  const [favoriteAnimal, setFavoriteAnimal] = useState("");
  const [profession, setProfession] = useState("");
  const [pronouns, setPronouns] = useState("");
  const [lastOnline, setLastOnline] = useState("");
  const [hobbies, setHobbies] = useState([]);
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
        setHobbies(u.hobbies || []);
        setFavoriteColor(u.favorite_color || "");
        setPhotoUri(u.photo_uri || "");
        setUserType(u.user_type || "");
        setFavoriteAnimal(u.favorite_animal || "");
        setProfession(u.profession || "");
        setPronouns(u.pronouns || "");
        setLastOnline(u.last_online || "");
        
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
            {auth.currentUser?.uid === id && (
              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  onClick={() => {
                    logButtonEvent(
                      "Edit profile button clicked!",
                      "/profile-view/[id]"
                    );
                    router.push("/profile");
                  }}
                  className="px-4 py-2 border border-gray-400 text-green-700 font-normal rounded-full hover:bg-gray-100 transition"
                >
                  Edit Profile
                </button>
              </div>
            )}
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
              {(userType == "child" || userType == "local_volunteer") && (
                <InfoDisplay title="Village" info={village} />
              )}
              <InfoDisplay title="Pronouns" info={pronouns} />
              <InfoDisplay title="Birthday" info={birthday} />
            </ProfileSection>
            {userType !== 'admin' && (
              <>
                <ProfileSection title={`Education ${(userType == "child" || userType == "local_volunteer") ? "& Family": ""}`}>
                  <InfoDisplay
                    title="Education Level"
                    info={educationLevel}
                  />
                  {(userType == "child" || userType == "local_volunteer") && (
                    <>
                      <InfoDisplay title="Guardian" info={guardian} />
                      <InfoDisplay title="Is Orphan" info={isOrphan} />
                    </>
                  )}
                </ProfileSection>

                <ProfileSection title="Interests">

                  <ArrayDisplay title="Hobbies" info={hobbies} />
                  <InfoDisplay title="Favorite Animal" info={favoriteAnimal} />
                  {userType == "international_buddy" && (
                    <>
                      <InfoDisplay title="Profession" info={profession} />
                      <InfoDisplay title="Last Online" info={lastOnline} />
                    </>
                  )}
                  {(userType == "child" || userType == "local_volunteer") && (
                    <>
                      <InfoDisplay title="Dream Job" info={dreamJob} />
                      <InfoDisplay title="Favorite Color" info={favoriteColor} />                
                    </>
                  )}

                </ProfileSection>
              </>
            )}
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

