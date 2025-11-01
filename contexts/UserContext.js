"use client";
import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter, usePathname } from 'next/navigation';
import { auth, db } from '../app/firebaseConfig'; // Adjust path as needed
import { getUserPfp } from '../app/utils/letterboxFunctions';
import LoadingSpinner from '../components/loading/LoadingSpinner';

const UserContext = createContext();
const PUBLIC_PATHS = ['/login', '/']; // public routes that don't require authentication

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const [userData, setUserData] = useState(null);
  const [profileImage, setProfileImage] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        setUser(authUser);
        
        // Fetch user type from Firestore
        try {
          const userDocRef = doc(db, 'users', authUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserData(userData); // Store all user data
            setUserType(userData.user_type || "Unknown Type");

            try {
              const pfp = await getUserPfp(authUser.uid);
              setProfileImage(pfp || '');
            } catch (error) {
              console.error('Error fetching profile image:', error);
              setProfileImage('');
            }
          } else {
            console.log('No user document found');
            setUserData(null);
            setUserType('Unknown Type'); // Default fallback
            setProfileImage('');
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUserData(null);
          setUserType('Unknown Type'); // Default fallback
          setProfileImage('');
        }
      } else {
        setUser(null);
        setUserType(null);
        setUserData(null);
        setProfileImage('');

        if (!PUBLIC_PATHS.includes(pathname)) {
          router.push('/login');
        } else {
          setLoading(false); // Only set false for public pages
        }
      }
    });

    return () => unsubscribe();
  }, [pathname, router]);

  const value = {
    user,
    userType,
    userData,
    profileImage,
    loading
  };

  if (loading) {
    return (
      <LoadingSpinner />
    );
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