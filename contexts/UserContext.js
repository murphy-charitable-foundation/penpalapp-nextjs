"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useRouter, usePathname } from "next/navigation";
import { auth, db } from "../app/firebaseConfig";
import { getUserPfp } from "../app/utils/avatarUtils";
import LoadingSpinner from "../components/loading/LoadingSpinner";
import { PUBLIC_PATHS } from "../app/utils/publicPaths";
import PolicyConsentModal from "../components/general/PolicyConsentModal";
import { POLICY_VERSIONS } from "../app/utils/policyVersions";

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const [userData, setUserData] = useState(null);
  const [profileImage, setProfileImage] = useState("");
  const [userDocRef, setUserDocRef] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(true);

  // Track profile loading separately from authentication.
  const [userDataStatus, setUserDataStatus] = useState("loading");

  const router = useRouter();
  const pathname = usePathname();

  const isPublicPath = PUBLIC_PATHS.includes(pathname);

  // Check whether the user has accepted the current policy versions.
  const needsPolicyConsent =
    !loading &&
    userDataStatus === "ready" &&
    !!user &&
    !!userData &&
    !isPublicPath &&
    (userData.policyConsent?.privacyPolicyVersion !==
      POLICY_VERSIONS.privacyPolicy ||
      userData.policyConsent?.termsOfServiceVersion !==
        POLICY_VERSIONS.termsOfService);

  useEffect(() => {
    let active = true;

    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (!active) return;

      setLoading(true);
      setUserDataStatus("loading");

      if (authUser) {
        setUser(authUser);
        setUserData(null);
        setUserType(null);

        const currentUserDocRef = doc(db, "users", authUser.uid);
        setUserDocRef(currentUserDocRef);

        try {
          const userDoc = await getDoc(currentUserDocRef);

          if (!active || auth.currentUser?.uid !== authUser.uid) return;

          if (userDoc.exists()) {
            const fetchedUserData = userDoc.data();

            setUserData(fetchedUserData);
            setUserType(fetchedUserData.user_type || "Unknown Type");
            setDisplayName(fetchedUserData.first_name || "");
            setUserDataStatus("ready");

            try {
              const pfp = await getUserPfp(authUser.uid);

              if (!active || auth.currentUser?.uid !== authUser.uid) return;

              setProfileImage(pfp || "");
            } catch (error) {
              console.error("Error fetching profile image:", error);

              if (active) {
                setProfileImage("");
              }
            }
          } else {
            // New users may not have completed account setup yet.
            setUserData(null);
            setUserType("Unknown Type");
            setProfileImage("");
            setDisplayName("");
            setUserDataStatus("missing");

            if (!isPublicPath && pathname !== "/create-acc") {
              router.push("/create-acc");
            }
          }
        } catch (error) {
          if (!active || auth.currentUser?.uid !== authUser.uid) return;

          console.error("Error fetching user data:", error);

          setUserData(null);
          setUserType("Unknown Type");
          setProfileImage("");
          setUserDataStatus("error");
        } finally {
          if (active && auth.currentUser?.uid === authUser.uid) {
            setLoading(false);
          }
        }
      } else {
        setUser(null);
        setUserType(null);
        setUserData(null);
        setProfileImage("");
        setUserDocRef(null);
        setDisplayName("");
        setUserDataStatus("missing");
        setLoading(false);

        if (!isPublicPath) {
          router.push("/login");
        }
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [pathname, router, isPublicPath]);

  // Save the accepted policy versions to the user's Firestore document.
  const handleAcceptPolicy = async () => {
    if (!userDocRef || !user) {
      throw new Error("User document is not available.");
    }

    const policyConsent = {
      privacyPolicyVersion: POLICY_VERSIONS.privacyPolicy,
      termsOfServiceVersion: POLICY_VERSIONS.termsOfService,
      acceptedAt: serverTimestamp(),
    };

    await updateDoc(userDocRef, {
      policyConsent,
    });

    setUserData((previousData) => ({
      ...previousData,
      policyConsent: {
        ...policyConsent,
        acceptedAt: new Date(),
      },
    }));
  };

  // Declining the updated policies ends the current session.
  const handleDeclinePolicy = async () => {
    await signOut(auth);
    router.replace("/login");
  };

  const value = {
    user,
    userType,
    userData,
    profileImage,
    displayName,
    userDocRef,
    loading,
  };

  if (!isPublicPath && loading) {
    return <LoadingSpinner />;
  }

  if (!isPublicPath && user && userDataStatus === "missing") {
    return <LoadingSpinner />;
  }

  if (!isPublicPath && user && userDataStatus === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-gray-800">
          We couldn&apos;t load your account information. Please try again.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-lg bg-green-700 px-5 py-2 text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <UserContext.Provider value={value}>
      {needsPolicyConsent ? (
        <PolicyConsentModal
          onAccept={handleAcceptPolicy}
          onDecline={handleDeclinePolicy}
        />
      ) : (
        children
      )}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);

  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }

  return context;
}
