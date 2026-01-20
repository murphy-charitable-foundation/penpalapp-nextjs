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
import Header from "../../components/general/Header";

const PAGE_SIZE = 20;

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

  //Auth guard
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

  //refetch when filters change
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
      const userRef = doc(db, "users", uid);
      const usersRef = collection(db, "users");

      let q = query(usersRef, where("user_type", "==", "child"));

      const ageActive = age?.min != null && age?.max != null;
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

      if (gender?.trim()) {
        q = query(q, where("gender", "==", gender.trim()));
      }

      if (hobbies?.length) {
        q = query(q, where("hobby", "array-contains-any", hobbies));
      }

      if (!reset && lastKidDoc && !initialLoad) {
        q = query(q, startAfter(lastKidDoc));
      }

      q = query(q, limit(PAGE_SIZE));

      const snapshot = await getDocs(q);

      const availableDocs = snapshot.docs.filter((d) => {
        const data = d.data();
        return !data.connected_penpals?.some(
          (ref) => ref?.path === userRef.path
        );
      });

      const kidsList = await Promise.all(
        availableDocs.map(async (d) => {
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
        snapshot.docs.length
          ? snapshot.docs[snapshot.docs.length - 1]
          : null
      );
    } catch (e) {
      setError("Error fetching kids");
      logError(e, { description: "Error fetching kids" });
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  const calculateAge = (birthdayTimestamp) => {
    if (!birthdayTimestamp) return 0;

    try {
      const date =
        birthdayTimestamp instanceof Date
          ? birthdayTimestamp
          : birthdayTimestamp.toDate?.() ??
            new Date(birthdayTimestamp._seconds * 1000);

      const now = new Date();
      let years = now.getFullYear() - date.getFullYear();

      if (
        now.getMonth() < date.getMonth() ||
        (now.getMonth() === date.getMonth() &&
          now.getDate() < date.getDate())
      ) {
        years -= 1;
      }

      return years;
    } catch {
      return 0;
    }
  };

  const loadMoreKids = () => {
    if (loading || !userId) return;
    fetchKids(userId);
    logButtonEvent("Load more kids", "/discovery");
  };

  const handleApplyFilters = ({ age, gender, hobbies }) => {
    setAge(age ?? null);
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
        {/* ===== HEADER ===== */}
        <PageHeader title="Discovery" image={false} showBackButton />
         {/* ===== Filter Panel ===== */}
          <Header
            activeFilter={filtersOpen}
            setActiveFilter={setFiltersOpen}
          />

          <div className="flex-1 overflow-y-auto px-6 py-6">
            {error && <div className="text-red-600 mb-3">{error}</div>}

            <KidsList
              kids={kids}
              calculateAge={calculateAge}
              loadMoreKids={loadMoreKids}
              loading={loading}
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
        onClose={() => setFiltersOpen(false)}
      />
    </PageBackground>
  );
}
