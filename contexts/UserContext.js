"use client";
import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import { useRouter, usePathname } from 'next/navigation';
import { auth, db } from '../app/firebaseConfig';
import { getUserPfp } from '../app/utils/avatarUtils';
import LoadingSpinner from '../components/loading/LoadingSpinner';
import { PUBLIC_PATHS } from "../app/utils/publicPaths";
import {
  getUserData,
  clearCachedUser,
} from "@/app/utils/sessionUserCache";

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const [userData, setUserData] = useState(null);
  const [profileImage, setProfileImage] = useState('');
  const [userDocRef, setUserDocRef] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const applyUserData = (data) => {
    setUserData(data);
    setUserType(data.user_type || 'Unknown Type');
    setDisplayName(data.first_name || '');
  };

  const loadProfileImage = async (uid) => {
    try {
      const pfp = await getUserPfp(uid);
      setProfileImage(pfp || '');
    } catch (error) {
      console.error('Error fetching profile image:', error);
      setProfileImage('');
    }
  };

  useEffect(() => {
    let lastUid = null;

    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        if (lastUid && lastUid !== authUser.uid) {
          clearCachedUser(lastUid);
        }

        lastUid = authUser.uid;
        setUser(authUser);

        const userDocRef = doc(db, 'users', authUser.uid);  // Create the ref
        setUserDocRef(userDocRef);  // Set it in state

        try {
          const fetchedUserData = await getUserData(authUser.uid, userDocRef);

          if (fetchedUserData) {
            applyUserData(fetchedUserData);
            await loadProfileImage(authUser.uid);
          } else {
            setUserData(null);
            setUserType('Unknown Type');
            setProfileImage('');

            if (!PUBLIC_PATHS.includes(pathname) && pathname !== '/create-acc') {
              router.push('/create-acc');
            }
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUserData(null);
          setUserType('Unknown Type');
          setProfileImage('');
        } finally {
          setLoading(false);
        }
      } else {
        if (lastUid) {
          clearCachedUser(lastUid);
        }
        lastUid = null;
        setUser(null);
        setUserType(null);
        setUserData(null);
        setProfileImage('');
        setUserDocRef(null);

        if (!PUBLIC_PATHS.includes(pathname)) {
          router.push('/login');
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
    displayName,
    userDocRef,
    loading
  };

  if (loading && !PUBLIC_PATHS.includes(pathname)) {
    return <LoadingSpinner />;
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}