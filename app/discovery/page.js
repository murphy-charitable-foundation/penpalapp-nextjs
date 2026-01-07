"use client";

import { useState, useEffect } from "react";
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
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

import { db, auth } from "../firebaseConfig";
import { logButtonEvent, logError } from "../utils/analytics";
import { usePageAnalytics } from "../useAnalytics";

import PageBackground from "../../components/general/PageBackground";
import { PageContainer } from "../../components/general/PageContainer";
import { PageHeader } from "../../components/general/PageHeader";
import NavBar from "../../components/bottom-nav-bar";

import KidsList from "../../components/discovery/KidsList";
import FilterPanel from "../../components/discovery/FilterPanel";

const PAGE_SIZE = 10;

export default function ChooseKid() {
  const router = useRouter();

  const [kids, setKids] = useState([]);
  const [lastKidDoc, setLastKidDoc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [userId, setUserId] = useState("");
  const [error, setError] = useState("");

  const [age, setAge] = useState(null);
  const [gender, setGender] = useState("");
  const [hobbies, setHobbies] = useState([]);

  
  const [filtersOpen, setFiltersOpen] = useState(false);

  usePageAnalytics("/discovery");

  // ✅ auth listener: 
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login");
        return;
      }
      setUserId(user.uid);
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!userId) return;

    setKids([]);
    setLastKidDoc(null);
    setInitialLoad(true);

    fetchKids(userId, true);
  }, [userId, age, gender, hobbies]);

  const fetchKids = async (uid, reset = false) => {
    setLoading(true);
    setError("");

    try {
      if (!uid) throw new Error("Login error. User may not be logged in.");

      const userRef = doc(db, "users", uid);
      const usersRef = collection(db, "users");
      let q = query(usersRef);

      const ageActive = age?.min != null && age?.max != null;

      //AGE range on server (birthday)
      if (ageActive) {
        const now = new Date();

        const maxBirthDate = new Date(
          now.getFullYear() - age.min,
          now.getMonth(),
          now.getDate()
        );

        const minBirthDate = new Date(
          now.getFullYear() - age.max - 1,
          now.getMonth(),
          now.getDate()
        );

        q = query(q, where("birthday", ">=", minBirthDate));
        q = query(q, where("birthday", "<=", maxBirthDate));
      }

      // ✅ Gender on server
      const genderNorm = (gender || "").trim();
      if (genderNorm) {
        q = query(q, where("gender", "==", genderNorm));
      }

      // ✅ Hobbies on server
      if (hobbies?.length) {
        q = query(q, where("hobby", "array-contains-any", hobbies));
      }

      // ✅ Base constraint always
      q = query(q, where("user_type", "==", "child"));


      // pagination
      if (!reset && lastKidDoc && !initialLoad) {
        q = query(q, startAfter(lastKidDoc));
      }

      q = query(q, limit(PAGE_SIZE));

      const snapshot = await getDocs(q);

      const filteredSnapshot = snapshot.docs.filter((d) => {
        const data = d.data();
        return !data.connected_penpals?.some(
          (penpalRef) => penpalRef?.path === userRef.path
        );
      });

      const kidsList = await Promise.all(
        filteredSnapshot.map(async (d) => {
          const data = d.data();

          try {
            if (data.photo_uri) {
              const storage = getStorage();
              const photoRef = ref(storage, data.photo_uri);
              const photoURL = await getDownloadURL(photoRef);
              return { id: d.id, ...data, photoURL };
            }

            return { id: d.id, ...data, photoURL: "/usericon.png" };
          } catch {
            return { id: d.id, ...data, photoURL: "/usericon.png" };
          }
        })
      );

      const finalKids = ageActive
        ? kidsList.filter((k) => (k.connected_penpals_count ?? 0) < 3)
        : kidsList;

      setKids((prev) => (reset ? finalKids : [...prev, ...finalKids]));
      setLastKidDoc(
        snapshot.docs.length ? snapshot.docs[snapshot.docs.length - 1] : null
      );
    } catch (e) {
      setError("Error fetching kids");
      logError(e, { description: "Error fetching kids" });
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  function calculateAge(birthdayTimestamp) {
    if (!birthdayTimestamp) return 0;

    let birthdayDate;
    try {
      if (birthdayTimestamp instanceof Date) birthdayDate = birthdayTimestamp;
      else if (typeof birthdayTimestamp.toDate === "function")
        birthdayDate = birthdayTimestamp.toDate();
      else if (birthdayTimestamp?._seconds)
        birthdayDate = new Date(birthdayTimestamp._seconds * 1000);
      else birthdayDate = new Date(birthdayTimestamp);

      if (isNaN(birthdayDate.getTime())) return 0;

      const now = new Date();
      let years = now.getFullYear() - birthdayDate.getFullYear();

      if (
        now.getMonth() < birthdayDate.getMonth() ||
        (now.getMonth() === birthdayDate.getMonth() &&
          now.getDate() < birthdayDate.getDate())
      ) {
        years -= 1;
      }

      return years;
    } catch {
      return 0;
    }
  }

  const loadMoreKids = () => {
    if (loading || !userId) return;
    fetchKids(userId, false);
    logButtonEvent("Load more button clicked!", "/discovery");
  };

  const handleApplyFilters = ({ age, gender, hobbies }) => {
    setAge(age ?? null); // {min,max} یا null
    setGender(gender ?? "");
    setHobbies(hobbies ?? []);
    setFiltersOpen(false);
  };

  const handleClearFilters = () => {
    setAge(null);
    setGender("");
    setHobbies([]);
    setFiltersOpen(false);
  };

  return (
    <PageBackground className="bg-gray-100 h-screen flex flex-col overflow-hidden">
      <div className="flex-1 min-h-0 flex justify-center">
        <PageContainer
          width="compactXS"
          padding="none"
          center={false}
          className="min-h-[92dvh] flex flex-col bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          <PageHeader title="Discovery" image={false} showBackButton />

          {/* Filters bar */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="w-full h-14 px-6 bg-blue-50 flex items-center justify-between text-lg font-semibold text-gray-900 border-y border-blue-100 hover:bg-blue-100 transition"
              aria-label="Open filters"
            >
              <span>Filters</span>
              <svg
                className={`h-5 w-5 text-gray-700 transition-transform ${
                  filtersOpen ? "rotate-180" : ""
                }`}
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M6 9l6 6 6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 py-6">
            {error ? (
              <div className="text-sm text-red-600 mb-3">{error}</div>
            ) : null}

            <KidsList
              kids={kids}
              calculateAge={calculateAge}
              lastKidDoc={lastKidDoc}
              loadMoreKids={loadMoreKids}
              loading={loading}
              error={error}
              showEmpty={!initialLoad}
              onClearFilters={handleClearFilters}
              onEditFilters={() => setFiltersOpen(true)}
            />
          </div>

          <div className="shrink-0 border-t bg-blue-100 rounded-b-2xl">
            <NavBar />
          </div>
        </PageContainer>
      </div>

      <FilterPanel
        open={filtersOpen}
        initial={{ age, gender, hobbies }}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
        onClose={() => setFiltersOpen(false)}
      />
    </PageBackground>
  );
}