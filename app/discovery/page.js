"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";

import { db } from "../firebaseConfig"; 

import NavBar from "../../components/bottom-nav-bar";
import { PageBackground } from "../../components/general/PageBackground";
import { PageContainer } from "../../components/general/PageContainer";
import Header from "../../components/general/Header";

import FilterPanel from "../../components/discovery/FilterPanel";
import KidsList from "../../components/discovery/KidsList";
import EmptyState from "../../components/discovery/EmptyState";

const PAGE_SIZE = 10;

/* ===== AGE CALC (supports Firestore Timestamp) ===== */
function calculateAge(dob) {
  if (!dob) return null;

  let d = null;

  // Firestore Timestamp
  if (typeof dob === "object" && dob?.toDate) {
    d = dob.toDate();
  } else if (dob instanceof Date) {
    d = dob;
  } else {
    // string like "2012-05-14"
    const parsed = new Date(dob);
    if (!Number.isNaN(parsed.getTime())) d = parsed;
  }

  if (!d) return null;

  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

export default function Discovery() {
  const [activeFilter, setActiveFilter] = useState(false);

  /* ===== FILTER STATE ===== */
  const [filters, setFilters] = useState({
    age: null, // { min, max } | null
    gender: null, // string | null
    hobbies: [],
  });

  /* ===== FIRESTORE DATA ===== */
  const [kids, setKids] = useState([]);
  const [kidsLoading, setKidsLoading] = useState(true);
  const [kidsError, setKidsError] = useState("");

  const KIDS_COLLECTION = "kids"; 

  useEffect(() => {
    let alive = true;

    async function fetchKids() {
      try {
        setKidsLoading(true);
        setKidsError("");

        const snap = await getDocs(collection(db, KIDS_COLLECTION));
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

        if (alive) setKids(data);
      } catch (e) {
        console.error("Failed to fetch kids:", e);
        if (alive) {
          setKids([]);
          setKidsError("Failed to load data.");
        }
      } finally {
        if (alive) setKidsLoading(false);
      }
    }

    fetchKids();
    return () => {
      alive = false;
    };
  }, []);

  /* ===== PAGINATION ===== */
  const [visibleKids, setVisibleKids] = useState([]);
  const [cursor, setCursor] = useState(0);
  const [loading, setLoading] = useState(false); // load more spinner

  /* ================= FILTER LOGIC ================= */
  const filteredKids = useMemo(() => {
    return kids.filter((k) => {
      // ---- GENDER ----
      if (filters.gender && k.gender !== filters.gender) {
        return false;
      }

      // ---- AGE ----
      if (filters.age) {
        const age = calculateAge(k.date_of_birth);
        if (age === null) return false;
        if (age < filters.age.min || age > filters.age.max) {
          return false;
        }
      }

      // ---- HOBBIES (id-based, OR logic) ----
      if (filters.hobbies.length > 0) {
        const kidHobbiesArr = Array.isArray(k.hobby) ? k.hobby : [];
        const kidHobbies = new Set(kidHobbiesArr);
        const selectedIds = filters.hobbies.map((h) => h.id);

        const hasAny = selectedIds.some((id) => kidHobbies.has(id));
        if (!hasAny) return false;
      }

      return true;
    });
  }, [kids, filters]);

  /* ================= RESET PAGINATION ON FILTER / DATA ================= */
  useEffect(() => {
    setCursor(0);
    setVisibleKids(filteredKids.slice(0, PAGE_SIZE));
  }, [filteredKids]);

  const loadMoreKids = () => {
    if (loading) return;
    setLoading(true);

  
    setTimeout(() => {
      const next = filteredKids.slice(
        cursor + PAGE_SIZE,
        cursor + PAGE_SIZE * 2
      );
      setVisibleKids((prev) => [...prev, ...next]);
      setCursor((c) => c + PAGE_SIZE);
      setLoading(false);
    }, 200);
  };

  const hasMore = cursor + PAGE_SIZE < filteredKids.length;

  /* ================= RENDER ================= */
  return (
    <PageBackground className="bg-gray-100 h-screen overflow-hidden flex flex-col">
      <div className="flex-1 min-h-0 flex justify-center">
        <PageContainer
          width="compactXS"
          padding="none"
          center={false}
          className="min-h-[92dvh] flex flex-col bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          {/* ===== HEADER ===== */}
          <div className="shrink-0 border-b">
            <Header
              activeFilter={activeFilter}
              setActiveFilter={setActiveFilter}
            />
          </div>

          {/* ===== LIST ===== */}
          <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-6">
            {kidsLoading ? (
              <div className="py-6 text-sm text-gray-600">Loading…</div>
            ) : kidsError ? (
              <div className="py-6 text-sm text-red-600">{kidsError}</div>
            ) : filteredKids.length === 0 ? (
              <EmptyState
                onClear={() =>
                  setFilters({ age: null, gender: null, hobbies: [] })
                }
              />
            ) : (
              <KidsList
                kids={visibleKids}
                calculateAge={calculateAge}
                loadMoreKids={hasMore ? loadMoreKids : null}
                loading={loading}
              />
            )}
          </div>

          {/* ===== NAV ===== */}
          <div className="shrink-0 border-t bg-blue-100 rounded-b-2xl">
            <NavBar />
          </div>

          {/* ===== FILTER PANEL ===== */}
          <FilterPanel
            open={activeFilter}
            initial={{
              age: filters.age,
              gender: filters.gender,
              hobbies: filters.hobbies,
            }}
            onApply={(f) => {
              setFilters({
                age: f.age || null,
                gender: f.gender || null,
                hobbies: Array.isArray(f.hobbies) ? f.hobbies : [],
              });
              setActiveFilter(false);
            }}
            onClear={() =>
              setFilters({ age: null, gender: null, hobbies: [] })
            }
            onClose={() => setActiveFilter(false)}
          />
        </PageContainer>
      </div>
    </PageBackground>
  );
}
