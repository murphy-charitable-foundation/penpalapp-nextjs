"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";

import { updateDoc } from "firebase/firestore";
import * as Sentry from "@sentry/nextjs";
import {
  User,
  MapPin,
  Home,
  FileText,
  Calendar,
  GraduationCap,
  Users,
  Heart,
  Briefcase,
  Square,
  Palette,
} from "lucide-react";
import Button from "../../components/general/Button";

export default function EditProfile() {
  // State initializations
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [birthday, setBirthday] = useState("");
  const [country, setCountry] = useState("");
  const [village, setVillage] = useState("");
  const [bio, setBio] = useState("");
  const [educationLevel, setEducationLevel] = useState("");
  const [isOrphan, setIsOrphan] = useState(false);
  const [guardian, setGuardian] = useState("");
  const [dreamJob, setDreamJob] = useState("");
  const [gender, setGender] = useState("");
  const [hobby, setHobby] = useState("");
  const [favoriteColor, setFavoriteColor] = useState("");
  const [photoUri, setPhotoUri] = useState("");
  const [user, setUser] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      if (auth.currentUser) {
        const uid = auth.currentUser.uid;
        const docRef = doc(db, "users", uid);
        const docSnap = await getDoc(docRef);
        console.log(docSnap.data());

        if (docSnap.exists()) {
          const userData = docSnap.data();
          setFirstName(userData.first_name || "");
          setLastName(userData.last_name || "");
          setEmail(userData.email || "");
          setBirthday(userData.birthday || "");
          setCountry(userData.country || "");
          setVillage(userData.village || "");
          setBio(userData.bio || "");
          setEducationLevel(userData.education_level || "");
          setIsOrphan(userData.is_orphan ? "Yes" : "No");
          setGuardian(userData.gaurdian || "");
          setDreamJob(userData.dream_job || "");
          setHobby(userData.hobby || "");
          setFavoriteColor(userData.favorite_color || "");
        } else {
          console.log("No such document!");
        }
      }
    };
    fetchUserData();
  }, [auth.currentUser]);

  // Save profile data to Firestore
  const saveProfileData = async () => {
    if (auth.currentUser) {
      const uid = auth.currentUser.uid;
      const userProfileRef = doc(db, "users", uid);

      const userProfile = {
        first_name: firstName,
        last_name: lastName,
        email,
        birthday,
        country,
        village,
        bio,
        education_level: educationLevel,
        is_orphan: isOrphan.toLowerCase() === "yes" ? true : false,
        gaurdian: guardian,
        dream_job: dreamJob,
        hobby,
        favorite_color: favoriteColor,
        gender,
      };

      try {
        await updateDoc(userProfileRef, userProfile);
        alert("Profile saved successfully!");
      } catch (error) {
        alert("Error saving profile");
        Sentry.captureException("Error saving profile " + error);
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        setUser(null);
        router.push("/login"); // Redirect to login page
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // User is signed out
      router.push("/login");
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-lg mx-auto p-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <button onClick={() => router.push("/letterhome")}>
              <svg
                className="h-6 w-6 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            <h1 className="ml-4 text-xl font-bold text-gray-800">
              Edit profile
            </h1>
          </div>
          {/* Logout Button */}
          <Button
            onClick={handleLogout}
            color="bg-red-500"
            textColor="text-white"
            hoverColor="hover:bg-red-600"
            btnType="submit"
            rounded="rounded-lg"
            btnText="Log out"
            size="w-24"
          />
        </div>

        {/* Profile Image */}
        <div className="my-6">
          <div className="relative w-24 h-24 mx-auto">
            <Image
              src={photoUri ? photoUri : "/murphylogo.png"}
              layout="fill"
              className="rounded-full"
              alt="Profile picture"
            />
            {/* Edit Icon */}
            <div
              className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full curspr-pointer"
              onClick={() => {
                router.push("/edit-profile-user-image");
              }}
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-6 mb-[120px]">
          {/* Personal Information Section */}
          <div className="space-y-4">
            <h3 className="text-blue-900 font-medium text-lg mb-4">
              Personal Information
            </h3>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <User className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500">First name</p>
                <input
                  type="text"
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full font-medium text-gray-900 bg-transparent border-b border-gray-300 p-2 focus:ring-0"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <User className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500">Last name</p>
                <input
                  type="text"
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full font-medium text-gray-900 bg-transparent border-b border-gray-300 p-2 focus:ring-0"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <MapPin className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500">Country</p>
                <input
                  type="text"
                  id="country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full font-medium text-gray-900 bg-transparent border-b border-gray-300 p-2 focus:ring-0"
                  placeholder="Ex: Country"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Home className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500">Village</p>
                <input
                  type="text"
                  id="village"
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  className="w-full font-medium text-gray-900 bg-transparent border-b border-gray-300 p-2 focus:ring-0"
                  placeholder="Ex: Village"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <FileText className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500">Bio/Challenges faced</p>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full font-medium text-gray-900 bg-transparent border-b border-gray-300 p-2 focus:ring-0 resize-none"
                  placeholder="Bio"
                  maxLength="50"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Calendar className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500">Birthday</p>
                <input
                  type="date"
                  id="birthday"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                  className="w-full font-medium text-gray-900 bg-transparent border-b border-gray-300 p-2 focus:ring-0"
                />
              </div>
            </div>
          </div>

          {/* Education & Family Section */}
          <div className="space-y-4">
            <h3 className="text-blue-900 font-medium text-lg mb-4">
              Education & Family
            </h3>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <GraduationCap className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500">Education level</p>
                <select
                  id="educationLevel"
                  value={educationLevel}
                  onChange={(e) => setEducationLevel(e.target.value)}
                  className="w-full font-medium text-gray-900 bg-transparent border-b border-gray-300 p-2 focus:ring-0"
                >
                  <option value="Elementary">Elementary</option>
                  <option value="Middle">Middle</option>
                  <option value="High School">High School</option>
                  <option value="College/University">College/University</option>
                  <option value="No Grade">No Grade</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Users className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500">Guardian</p>
                <select
                  id="guardian"
                  value={guardian}
                  onChange={(e) => setGuardian(e.target.value)}
                  className="w-full font-medium text-gray-900 bg-transparent border-b border-gray-300 p-2 focus:ring-0"
                >
                  <option value="Parents">Parents</option>
                  <option value="AdoptiveParents">Adoptive Parents</option>
                  <option value="Aunt/Uncle">Aunt/Uncle</option>
                  <option value="Grandparents">Grandparents</option>
                  <option value="Other Family">Other Family</option>
                  <option value="Friends">Friends</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Heart className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500">Is orphan</p>
                <select
                  id="isOrphan"
                  value={isOrphan}
                  onChange={(e) => setIsOrphan(e.target.value)}
                  className="w-full font-medium text-gray-900 bg-transparent border-b border-gray-300 p-2 focus:ring-0"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
            </div>
          </div>

          {/* Interest Section */}
          <div className="space-y-4">
            <h3 className="text-blue-900 font-medium text-lg mb-4">Interest</h3>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Briefcase className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Dream job</p>
                <input
                  type="text"
                  id="dreamjob"
                  value={dreamJob}
                  onChange={(e) => setDreamJob(e.target.value)}
                  className="font-medium text-gray-900 bg-transparent border-b border-gray-300 p-2 focus:ring-0"
                  placeholder="Airplane pilote"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Square className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Hobby</p>
                <input
                  type="text"
                  id="hobby"
                  value={hobby}
                  onChange={(e) => setHobby(e.target.value)}
                  className="font-medium text-gray-900 bg-transparent border-b border-gray-300 p-2 focus:ring-0"
                  placeholder="Dancing"
                />
              </div>
            </div>
          </div>

          {/* Favorite Color */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Palette className="w-5 h-5 text-gray-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500">Favorite Color</p>
              <input
                type="text"
                id="favoriteColor"
                value={favoriteColor}
                onChange={(e) => setFavoriteColor(e.target.value)}
                className="w-full font-medium text-gray-900 bg-transparent border-b border-gray-300 p-2 focus:ring-0"
                placeholder="Ex: Blue"
              />
            </div>
          </div>

          <div className="flex justify-center">
            <Link
              href="/letterhome"
              className="transition-transform hover:scale-105 focus:outline-none"
              onClick={(e) => {
                e.preventDefault();
                saveProfileData().then(() => {
                  router.push("/letterhome");
                });
              }}
            >
              <Button
                btnType="button"
                btnText={
                  isSaving ? (
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-gray-400"></div>
                  ) : (
                    "Save"
                  )
                }
                color="bg-green-800"
                hoverColor="hover:bg-[#48801c]"
                textColor="text-gray-200"
                disabled={isSaving}
                rounded="rounded-full"
              />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
