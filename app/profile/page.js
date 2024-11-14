"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import { updateDoc } from "firebase/firestore";
import BottomNavBar from "@/components/bottom-nav-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function EditProfile() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [birthday, setBirthday] = useState("");
  const [country, setCountry] = useState("");
  const [village, setVillage] = useState("");
  const [bio, setBio] = useState("");
  const [educationLevel, setEducationLevel] = useState("");
  const [isOrphan, setIsOrphan] = useState(false);
  const [livesWith, setLivesWith] = useState("");
  const [dreamJob, setDreamJob] = useState("");
  const [hobby, setHobby] = useState("");
  const [favoriteColor, setFavoriteColor] = useState("");
  const [user, setUser] = useState(null);

  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      if (auth.currentUser) {
        const uid = auth.currentUser.uid;
        const docRef = doc(db, "users", uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const userData = docSnap.data();
          setFirstName(userData.firstName || "");
          setLastName(userData.lastName || "");
          setEmail(userData.email || "");
          setBirthday(userData.birthday || "");
          setCountry(userData.country || "");
          setVillage(userData.village || "");
          setBio(userData.bio || "");
          setEducationLevel(userData.educationLevel || "");
          setIsOrphan(userData.isOrphan ? "Yes" : "No");
          setLivesWith(userData.livesWith || "");
          setDreamJob(userData.dreamJob || "");
          setHobby(userData.hobby || "");
          setFavoriteColor(userData.favoriteColor || "");
        } else {
          console.log("No such document!");
        }
      } else {
        console.log("No user logged in");
        router.push("/login");
      }
    };

    fetchUserData();
  }, [auth.currentUser]);

  const saveProfileData = async () => {
    if (auth.currentUser) {
      const uid = auth.currentUser.uid;
      const userProfileRef = doc(db, "users", uid);

      const userProfile = {
        firstName,
        lastName,
        email,
        birthday,
        country,
        village,
        bio,
        educationLevel,
        isOrphan: isOrphan === "Yes" ? true : false,
        livesWith,
        dreamJob,
        hobby,
        favoriteColor,
      };

      try {
        await updateDoc(userProfileRef, userProfile);
        alert("Profile saved successfully!");
      } catch (error) {
        console.error("Error saving profile: ", error);
        alert("Error saving profile.");
      }
    } else {
      alert("No user logged in.");
      // router.push('/login');
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        setUser(null);
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen mb-8">
      <Card className="max-w-lg mx-auto p-6">
        <CardHeader className="flex justify-between items-start">
          <div className="flex items-center">
            <Button variant="ghost" onClick={() => window.history.back()}>
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
            </Button>
            <CardTitle className="ml-4 text-xl font-bold text-gray-800">
              Edit profile
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {/* Profile Image */}
          <div className="my-6">
            <div className="relative w-24 h-24 mx-auto">
              <div className="flex flex-row items-center justify-between">
              <Image
                src="/murphylogo.png"
                width={96}
                height={96}
                className="rounded-full"
                alt="Profile picture"
              />
          </div>
              {/* Edit Icon */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full"
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
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  {/* Add your edit image functionality here */}
                </PopoverContent>
              </Popover>
            </div>
          </div>
          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="firstName">First name</Label>
              <Input
                type="text"
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last name</Label>
              <Input
                type="text"
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
            {/* Country Field */}
            <div>
              <Label htmlFor="country">Country</Label>
              <Input
                type="text"
                id="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Ex: Country"
              />
            </div>
            {/* Village Field */}
            <div>
              <Label htmlFor="village">Village</Label>
              <Input
                type="text"
                id="village"
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                placeholder="Ex: Village"
              />
            </div>
            {/* Bio/Challenges faced Field */}
            <div>
              <Label htmlFor="bio">Bio/Challenges faced</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Bio"
                maxLength="50"
              />
            </div>
            {/* Birthday Field */}
            <div>
              <Label htmlFor="birthday">Birthday</Label>
              <Input
                type="date"
                id="birthday"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
              />
            </div>
            {/* Education Level Dropdown */}
            <div>
              <Label htmlFor="educationLevel">Education level</Label>
              <Select value={educationLevel} onValueChange={setEducationLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select education level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Elementary">Elementary</SelectItem>
                  <SelectItem value="Middle">Middle</SelectItem>
                  <SelectItem value="High School">High School</SelectItem>
                  <SelectItem value="College/University">
                    College/University
                  </SelectItem>
                  <SelectItem value="No Grade">No Grade</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Is Orphan Dropdown */}
            <div>
              <Label htmlFor="isOrphan">Is orphan</Label>
              <Select value={isOrphan} onValueChange={setIsOrphan}>
                <SelectTrigger>
                  <SelectValue placeholder="Select orphan status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="No">No</SelectItem>
                  <SelectItem value="Yes">Yes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="livesWith">Who the child lives with</Label>
              <Select value={livesWith} onValueChange={setLivesWith}>
                <SelectTrigger>
                  <SelectValue placeholder="Select who the child lives with" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Parents">Parents</SelectItem>
                  <SelectItem value="AdoptiveParents">
                    AdoptiveParents
                  </SelectItem>
                  <SelectItem value="Aunt/Uncle">Aunt/Uncle</SelectItem>
                  <SelectItem value="Grandparents">Grandparents</SelectItem>
                  <SelectItem value="Other Family">Other Family</SelectItem>
                  <SelectItem value="Friends">Friends</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="dreamJob">Dream job</Label>
              <Input
                type="text"
                id="dreamJob"
                value={dreamJob}
                onChange={(e) => setDreamJob(e.target.value)}
                placeholder="Ex: Astronaut"
              />
            </div>
            <div>
              <Label htmlFor="hobby">Hobby</Label>
              <Input
                type="text"
                id="hobby"
                value={hobby}
                onChange={(e) => setHobby(e.target.value)}
                placeholder="Ex: Football"
              />
            </div>
            <div>
              <Label htmlFor="favoriteColor">Favorite Color</Label>
              <Input
                type="text"
                id="favoriteColor"
                value={favoriteColor}
                onChange={(e) => setFavoriteColor(e.target.value)}
                placeholder="Ex: Blue"
              />
            </div>
            <div className="flex items-stretch justify-between">
              <Button variant="destructive" onClick={handleLogout}>
                Log out
              </Button>
              <Link href="/letterhome">
            <Button onClick={saveProfileData}>Save</Button>
          </Link>
            </div>
          </div>
        </CardContent>
      </Card>
      <BottomNavBar />
    </div>
  );
}