"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, auth } from "../../firebaseConfig";

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
import Button from "../../../components/general/Button";
import Input from "../../../components/general/Input";
import Modal from "../../../components/general/Modal";
import { BackButton } from "../../../components/general/BackButton";
import { PageContainer } from "../../../components/general/PageContainer";
import Popover from "../../../components/general/Popover";

export default function Page({ params }) {
  const { id } = params;
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
  
  // Modal state
  const [isEducationModalOpen, setIsEducationModalOpen] = useState(false);
  const [isGuardianModalOpen, setIsGuardianModalOpen] = useState(false);
  const [isOrphanModalOpen, setIsOrphanModalOpen] = useState(false);
  const [isBioModalOpen, setIsBioModalOpen] = useState(false);
  const [tempBio, setTempBio] = useState("");

  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      if (auth.currentUser) {
        const uid = id;
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
          setPhotoUri(userData.photo_uri || "");
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

  // Education options
  const educationOptions = [
    "Elementary",
    "Middle",
    "High School",
    "College/University",
    "No Grade"
  ];

  // Guardian options
  const guardianOptions = [
    "Parents",
    "Adoptive Parents",
    "Aunt/Uncle",
    "Grandparents",
    "Other Family",
    "Friends",
    "Other"
  ];

  // Education Modal content
  const educationModalContent = (
    <div className="space-y-4">
      <p className="text-sm text-gray-500 mb-4">Select your education level:</p>
      <div className="grid grid-cols-1 gap-3">
        {educationOptions.map((option) => (
          <button
            key={option}
            className={`p-3 rounded-lg text-left ${
              educationLevel === option
                ? "bg-green-100 border border-green-500"
                : "bg-gray-50 hover:bg-gray-100"
            }`}
            onClick={() => {
              setEducationLevel(option);
              setIsEducationModalOpen(false);
            }}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );

  // Guardian Modal content
  const guardianModalContent = (
    <div className="space-y-4">
      <p className="text-sm text-gray-500 mb-4">Select your guardian:</p>
      <div className="grid grid-cols-1 gap-3">
        {guardianOptions.map((option) => (
          <button
            key={option}
            className={`p-3 rounded-lg text-left ${
              guardian === option
                ? "bg-green-100 border border-green-500"
                : "bg-gray-50 hover:bg-gray-100"
            }`}
            onClick={() => {
              setGuardian(option);
              setIsGuardianModalOpen(false);
            }}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );

  // Orphan Modal content
  const orphanModalContent = (
    <div className="space-y-4">
      <p className="text-sm text-gray-500 mb-4">Are you an orphan?</p>
      <div className="grid grid-cols-2 gap-3">
        {["Yes", "No"].map((option) => (
          <button
            key={option}
            className={`p-3 rounded-lg text-center ${
              isOrphan === option
                ? "bg-green-100 border border-green-500"
                : "bg-gray-50 hover:bg-gray-100"
            }`}
            onClick={() => {
              setIsOrphan(option);
              setIsOrphanModalOpen(false);
            }}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );

  // Bio Modal content
  const bioModalContent = (
    <div className="space-y-4">
      <p className="text-sm text-gray-500 mb-2">Share your challenges or a brief bio:</p>
      <textarea
        value={tempBio}
        onChange={(e) => setTempBio(e.target.value)}
        className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
        placeholder="Write about yourself or challenges you've faced..."
        maxLength={200}
      />
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-500">
          {tempBio.length}/200 characters
        </span>
        <Button
          btnText="Save"
          color="bg-green-800"
          hoverColor="hover:bg-[#48801c]"
          textColor="text-white"
          rounded="rounded-lg"
          size="w-24"
          onClick={() => {
            setBio(tempBio);
            setIsBioModalOpen(false);
          }}
        />
      </div>
    </div>
  );

  // Open bio Modal and set temp bio
  const handleOpenBioModal = () => {
    setTempBio(bio);
    setIsBioModalOpen(true);
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <PageContainer maxWidth="lg" padding="p-6 pt-20">
      <BackButton />
      <div className="max-w-lg mx-auto p-6 pt-4">
        <div className="flex justify-end">
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

        {/* Education Level Modal */}
        <Modal
          isOpen={isEducationModalOpen}
          onClose={() => setIsEducationModalOpen(false)}
          title="Education Level"
          content={educationModalContent}
          width="large"
        />

        {/* Guardian Modal */}
        <Modal
          isOpen={isGuardianModalOpen}
          onClose={() => setIsGuardianModalOpen(false)}
          title="Guardian"
          content={guardianModalContent}
          width="large"
        />

        {/* Orphan Modal */}
        <Modal
          isOpen={isOrphanModalOpen}
          onClose={() => setIsOrphanModalOpen(false)}
          title="Orphan Status"
          content={orphanModalContent}         
          width="large"
        />

        {/* Bio Modal */}
        <Modal
          isOpen={isBioModalOpen}
          onClose={() => setIsBioModalOpen(false)}
          title="Bio/Challenges"
          content={bioModalContent}
          width="large"
          
        />

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
                <p className="text-sm text-500">First Name</p>
                  <span>{firstName != "" ? firstName : "Unknown"}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <User className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-500">Last Name</p>
                  <span>{lastName != "" ? lastName : "Unknown"}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <MapPin className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-500">Country</p>
                  <span>{country != "" ? country : "Unknown"}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Home className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-500">Village</p>
                  <span>{village != "" ? village : "Unknown"}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <FileText className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-500">Bio/Challenges faced</p>
                  <span className="truncate">
                    {bio ? bio : "Unknown"}
                  </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Calendar className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-500">Birthday</p>
                  <span>{birthday || "Unknown"}</span>
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
                <p className="text-sm text-500">Education level</p>
                  <span>{educationLevel || "Unknown"}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Users className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-500">Guardian</p>
                  <span>{guardian || "Unknown"}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Heart className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-500">Is orphan</p>
                  <span>{isOrphan || "Unknown"}</span>
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
              <div className="flex-1">
                <p className="text-sm text-500">Dream Job</p>
                  <span>{dreamJob != "" ? dreamJob : "Unknown"}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Square className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-500">Hobby</p>
                  <span>{hobby != "" ? hobby : "Unknown"}</span>
              </div>
            </div>
          </div>

          {/* Favorite Color */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Palette className="w-5 h-5 text-gray-600" />
            </div>
              <div className="flex-1">
                <p className="text-sm text-500">Favorite Color</p>
                  <span>{favoriteColor != "" ? favoriteColor : "Unknown"}</span>
              </div>
          </div>
        </div>
      </div>
      </PageContainer>
    </div>
  );
}