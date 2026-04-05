"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter, usePathname } from "next/navigation";
import { auth, db } from "../app/firebaseConfig";
import { getUserPfp } from "../app/utils/letterboxFunctions";
import LoadingSpinner from "../components/loading/LoadingSpinner";

const UserContext = createContext();

const PUBLIC_PATHS = [
  "/login",
  "/",
  "/about",
  "/contact",
  "/donate",
  "/welcome",
  "/create-acc",
  "/reset-password",
];

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const [userData, setUserData] = useState(null);
  const [profileImage, setProfileImage] = useState("");
  const [userDocRef, setUserDocRef] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        setUser(authUser);

        const userDocRef = doc(db, "users", authUser.uid); // Create the ref
        setUserDocRef(userDocRef); // Set it in state

        // Fetch user type from Firestore
        try {
          const userDocRef = doc(db, "users", authUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const fetchedUserData = userDoc.data();
            setUserData(fetchedUserData);
            setUserType(fetchedUserData.user_type || "Unknown Type");

            try {
              const pfp = await getUserPfp(authUser.uid);
              setProfileImage(pfp || "");
            } catch (error) {
              console.error("Error fetching profile image:", error);
              setProfileImage("");
            }
          } else {
            setUserData(null);
            setUserType("Unknown Type");
            setProfileImage("");

            if (pathname !== "/create-acc") {
              router.push("/create-acc");
            }
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUserData(null);
          setUserType("Unknown Type");
          setProfileImage("");
        } finally {
          setLoading(false);
        }
      } else {
        setUser(null);
        setUserType(null);
        setUserData(null);
        setProfileImage("");
        setUserDocRef(null);

        if (!PUBLIC_PATHS.includes(pathname)) {
          router.push("/login");
        }
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [pathname, router]);

  const value = {
    user,
    userType,
    userData,
    profileImage,
    userDocRef,
    loading,
  };

  if (loading && !PUBLIC_PATHS.includes(pathname)) {
    return <LoadingSpinner />;
  }

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
