"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";

import { updateDoc } from "firebase/firestore";
import HobbySelect from "@/components/general/HobbySelect";
import { usePageAnalytics } from "@/app/utils/useAnalytics";
import { logButtonEvent, logLoadingTime } from "@/app/firebaseConfig";
import * as Sentry from "@sentry/nextjs";

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

  const router = useRouter();
  usePageAnalytics("/profile");

  useEffect(() => {
    const startTime = performance.now();
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

        requestAnimationFrame(() => {
          setTimeout(() => {
            const endTime = performance.now();
            const loadTime = endTime - startTime;
            console.log(`Page render time: ${loadTime}ms`);
            logLoadingTime("/profile", loadTime);
          }, 0);
        });
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

      logButtonEvent("Save Profile clicked!", "/profile");
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
            <button onClick={() => window.history.back()}>
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
          <Link href="/letterhome">
            <button
              onClick={saveProfileData}
              className="bg-green-500 text-white py-2 px-4 rounded"
            >
              Save
            </button>
          </Link>
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
        <div className="space-y-4 mb-[120px]">
          <div>
            <label
              htmlFor="firstName"
              className="text-sm font-medium text-gray-700 block mb-2"
            >
              First name
            </label>
            <input
              type="text"
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md text-black"
            />
          </div>
          <div>
            <label
              htmlFor="lastName"
              className="text-sm font-medium text-gray-700 block mb-2"
            >
              Last name
            </label>
            <input
              type="text"
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md text-black"
            />
          </div>

          {/* Country Field */}
          <div>
            <label
              htmlFor="country"
              className="text-sm font-medium text-gray-700 block mb-2"
            >
              Country
            </label>
            <input
              type="text"
              id="country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md text-black"
              placeholder="Ex: Country"
            />
          </div>

          {/* Village Field */}
          <div>
            <label
              htmlFor="village"
              className="text-sm font-medium text-gray-700 block mb-2"
            >
              Village
            </label>
            <input
              type="text"
              id="village"
              value={village}
              onChange={(e) => setVillage(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md text-black"
              placeholder="Ex: Village"
            />
          </div>

          {/* Bio/Challenges faced Field */}
          <div>
            <label
              htmlFor="bio"
              className="text-sm font-medium text-gray-700 block mb-2"
            >
              Bio/Challenges faced
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md text-black"
              placeholder="Bio"
              maxLength="50"
            />
          </div>

          {/* Birthday Field */}
          <div>
            <label
              htmlFor="birthday"
              className="text-sm font-medium text-gray-700 block mb-2"
            >
              Birthday
            </label>
            <input
              type="date"
              id="birthday"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md text-black"
            />
          </div>

          {/* Education Level Dropdown */}
          <div>
            <label
              htmlFor="educationLevel"
              className="text-sm font-medium text-gray-700 block mb-2"
            >
              Education level
            </label>
            <select
              id="educationLevel"
              value={educationLevel}
              onChange={(e) => setEducationLevel(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md text-black"
            >
              <option value="Elementary">Elementary</option>
              <option value="Middle">Middle</option>
              <option value="High School">High School</option>
              <option value="College/University">College/University</option>
              <option value="No Grade">No Grade</option>
            </select>
          </div>

          {/* Is Orphan Dropdown */}
          <div>
            <label
              htmlFor="isOrphan"
              className="text-sm font-medium text-gray-700 block mb-2"
            >
              Is orphan
            </label>
            <select
              id="isOrphan"
              value={isOrphan}
              onChange={(e) => setIsOrphan(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md text-black"
            >
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="isOrphan"
              className="text-sm font-medium text-gray-700 block mb-2"
            >
              Who the child lives with
            </label>
            <select
              id="isOrphan"
              value={guardian}
              onChange={(e) => setGuardian(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md text-black"
            >
              <option value="Parents">Parents</option>
              <option value="AdoptiveParents">AdoptiveParents</option>
              <option value="Aunt/Uncle">Aunt/Uncle</option>
              <option value="Grandparents">Grandparents</option>
              <option value="Other Family">Other Family</option>
              <option value="Friends">Friends</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="village"
              className="text-sm font-medium text-gray-700 block mb-2"
            >
              Dream job
            </label>
            <input
              type="text"
              id="dreamjob"
              value={dreamJob}
              onChange={(e) => setDreamJob(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md text-black"
              placeholder="Ex: Astronaut"
            />
          </div>

          <div>
            <label
              htmlFor="village"
              className="text-sm font-medium text-gray-700 block mb-2"
            >
              Hobby
            </label>
            <input
              type="text"
              id="hobby"
              value={hobby}
              onChange={(e) => setHobby(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md text-black"
              placeholder="Ex: Football"
            />
          </div>

          <div>
            <label
              htmlFor="village"
              className="text-sm font-medium text-gray-700 block mb-2"
            >
              Favorite Color
            </label>
            <input
              type="text"
              id="favcolor"
              value={favoriteColor}
              onChange={(e) => setFavoriteColor(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md text-black"
              placeholder="Ex: Blue"
            />
          </div>

          <div>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white py-2 px-4 rounded"
            >
              Log out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
