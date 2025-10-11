"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { db, auth } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  getDocs,
  doc,
  query,
  startAfter,
  limit,
  where,
} from "firebase/firestore";

import { getStorage, ref, getDownloadURL } from "firebase/storage";

import { PageBackground } from "../../components/general/PageBackground";
import { PageContainer } from "../../components/general/PageContainer";
import { BackButton } from "../../components/general/BackButton";
import BottomNavBar from "../../components/bottom-nav-bar";

import Header from "../../components/general/Header";
import KidsList from "../../components/discovery/KidsList";
import KidFilter from "../../components/discovery/KidFilter";

import { usePageAnalytics } from "../useAnalytics";
import { logError, logButtonEvent } from "../utils/analytics";


export default function ChooseKid() {
  const [activeFilter, setActiveFilter] = useState(false);
  const [kids, setKids] = useState([]);
  const [lastKidDoc, setLastKidDoc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [userId, setUserId] = useState("");
  const router = useRouter();

  const [age, setAge] = useState(0);
  const [gender, setGender] = useState("");
  const [hobbies, setHobbies] = useState([]);
  const PAGE_SIZE = 10;


  usePageAnalytics("/discovery");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        //redirect if everything is loaded and still no user
        router.push("/login");
        return;
      } else {
        try {
          const uid = user.uid;
          setUserId(uid);
          await fetchKids(uid);
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      }
    });
    return () => unsubscribe();
  }, [age, gender, hobbies]);

  useEffect(() => {
    console.log("Age:", age);
  }, [age]);

  const fetchKids = async (uid) => {
    setLoading(true);
    try {
      if (!uid) {
        throw new Error("Login error. User may not be logged in properly.");
      }
      const userRef = doc(db, "users", uid);
      const kidsCollectionRef = collection(db, "users");
      let q = query(kidsCollectionRef);

      // Apply filters
      if (age > 0) {
        const currentDate = new Date();
        const minBirthDate = new Date(
          currentDate.getFullYear() - age - 1,
          currentDate.getMonth(),
          currentDate.getDate()
        );
        const maxBirthDate = new Date(
          currentDate.getFullYear() - age,
          currentDate.getMonth(),
          currentDate.getDate()
        );

        q = query(q, where("date_of_birth", ">=", minBirthDate));
        q = query(q, where("date_of_birth", "<=", maxBirthDate));
      }

      if (gender && gender.length > 0) {
        q = query(q, where("gender", "==", gender));
      }

      if (hobbies && hobbies.length > 0) {
        q = query(q, where("hobby", "array-contains-any", hobbies));
      }

      q = query(q, where("user_type", "==", "child"));
      q = query(q, where("connected_penpals_count", "<", 3));

      if (lastKidDoc && !initialLoad) {
        q = query(q, startAfter(lastKidDoc));
      }
      q = query(q, limit(PAGE_SIZE));
      const snapshot = await getDocs(q);

      const filteredSnapshot = snapshot.docs.filter((doc) => {
        const data = doc.data();
        return !data.connected_penpals?.some(
          (penpalRef) => penpalRef.path === userRef.path
        );
      });

      const kidsList = await Promise.all(
        filteredSnapshot.map(async (doc) => {
          //Still needed as photo_uri is not currently directly stored under profile
          const data = doc.data();
          try {
            if (data.photo_uri) {
              const storage = getStorage();
              const photoRef = ref(storage, data.photo_uri);
              const photoURL = await getDownloadURL(photoRef);
              return {
                id: doc.id,
                ...data,
                photoURL,
              };
            } else {
              return {
                id: doc.id,
                ...data,
                photoURL: "/usericon.png", // Default image if no photo_uri
              };
            }
          } catch (error) {
            if (error.code === "storage/object-not-found") {
              return {
                id: doc.id,
                ...data,
                photoURL: "/usericon.png", // Default image if photo not found
              };
            } else {
              console.error("Error fetching photo URL:", error);
              return {
                id: doc.id,
                ...data,
                photoURL: "/usericon.png", // Default image if other errors
              };
            }
          }
        })
      );

      setKids((prevKids) => {
        if (initialLoad) {
          return kidsList;
        } else {
          return [...prevKids, ...kidsList];
        }
      });

      if (snapshot.docs.length > 0) {
        setLastKidDoc(snapshot.docs[snapshot.docs.length - 1]);
      } else {
        setLastKidDoc(null);
      }
    } catch (error) {
      logError(error, {
        description: "Error fetching kids:",
      });
    } finally {
      setLoading(false);
    }, 120);
    return () => clearTimeout(t);
  }, [filtered, page]);

  const loadMoreKids = () => {
    if (!loading && kids.length < filtered.length) setPage((p) => p + 1);
  };

  const lastKidDoc = kids.length < filtered.length ? { mockIndex: kids.length - 1 } : null;

  const applyFilter = (ageVal, hobbyArr, genderVal) => {
    setAge(Number(ageVal) || 0);
    setHobbies(hobbyArr || []);
    setGender(genderVal || "");
    setPage(1);
    setActiveFilter(false);
  };

  const loadMoreKids = () => {
    if (loading) return;
    fetchKids(userId);
    logButtonEvent("Load more button clicked!", "/discovery");
  };

  return (
    <PageBackground>
      <PageContainer maxWidth="lg">
      <BackButton />
      <div className="min-h-screen p-4 bg-white">
        <div className="bg-white">
          <Header activeFilter={activeFilter} setActiveFilter={setActiveFilter} title={"Choose a kid to write to"} />
          {activeFilter ? (
            <div className="h-auto">
              <KidFilter
                setAge={setAge}
                setGender={setGender}
                setHobbies={setHobbies}
                hobbies={hobbies}
                age={age}
                gender={gender}
                filter={filter}
              />
            </div>
          ) : (
            <KidsList
              kids={kids}
              calculateAge={calculateAge}
              lastKidDoc={lastKidDoc}
              loadMoreKids={loadMoreKids}
              loading={loading}
            />
          )}
        </div>
      </div>
    </PageContainer>
    <BottomNavBar />
    </PageBackground>
  );
}
