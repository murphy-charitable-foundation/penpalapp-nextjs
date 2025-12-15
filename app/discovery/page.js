"use client";

import { useEffect, useMemo, useState } from "react";
import NavBar from "../../components/bottom-nav-bar";
import { PageBackground } from "../../components/general/PageBackground";
import { PageContainer } from "../../components/general/PageContainer";
import Header from "../../components/general/Header";
import FilterPanel from "../../components/discovery/FilterPanel";
import EmptyState from "../../components/discovery/EmptyState";
import KidsList from "../../components/discovery/KidsList";

const PAGE_SIZE = 10;

// --- mock data ---
const MOCK_KIDS = [
  {
    id: "k1",
    first_name: "Joan",
    last_name: "A.",
    gender: "Female",
    hobby: ["Reading", "Drawing"],
    date_of_birth: "2012-05-14",
    photoURL: "/usericon.png",
    bio: "Learn, play and write kind letters.",
  },
  {
    id: "k2",
    first_name: "Amir",
    last_name: "K.",
    gender: "Male",
    hobby: ["Football", "Music"],
    date_of_birth: "2011-08-02",
    photoURL: "/usericon.png",
    bio: "Curious about music and science.",
  },
  {
    id: "k3",
    first_name: "Sara",
    last_name: "N.",
    gender: "Female",
    hobby: ["Chess", "Coding"],
    date_of_birth: "2013-02-20",
    photoURL: "/usericon.png",
    bio: "Enjoys reading and puzzles.",
  },
];

function calculateAge(dob) {
  if (!dob) return null;
  const d = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

export default function Discovery() {
  const [activeFilter, setActiveFilter] = useState(false);

  // age = { min, max } | undefined
  const [filters, setFilters] = useState({
    age: undefined,
    gender: "",
    hobbies: [],
  });

  // pagination state
  const [visibleKids, setVisibleKids] = useState([]);
  const [cursor, setCursor] = useState(0);
  const [loading, setLoading] = useState(false);

  /* ================= FILTER LOGIC ================= */
  const filteredKids = useMemo(() => {
    return MOCK_KIDS.filter((k) => {
      // gender
      if (filters.gender && k.gender !== filters.gender) return false;

      // age bracket
      if (filters.age) {
        const age = calculateAge(k.date_of_birth);
        if (age === null) return false;
        if (age < filters.age.min || age > filters.age.max) return false;
      }

      // hobbies (AND logic, case-insensitive)
      if (filters.hobbies.length) {
        const hv = new Set((k.hobby || []).map((h) => h.toLowerCase()));
        if (
          !filters.hobbies.every((h) => hv.has(h.toLowerCase()))
        )
          return false;
      }

      return true;
    });
  }, [filters]);

  /* ================= PAGINATION ================= */
  useEffect(() => {
    // reset pagination whenever filter result changes
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

          {/* ===== SINGLE SCROLLER ===== */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 pb-6">
            {filteredKids.length === 0 ? (
              <EmptyState
                onClear={() =>
                  setFilters({ age: undefined, gender: "", hobbies: [] })
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

          {/* ===== NAVBAR ===== */}
          <div className="shrink-0 border-t bg-blue-100 rounded-b-2xl">
            <NavBar />
          </div>

          {/* ===== FILTER PANEL ===== */}
          <FilterPanel
            open={activeFilter}
            initial={{
              age: filters.age || null,
              gender: filters.gender,
              hobbies: filters.hobbies,
            }}
            onApply={(f) => {
              setFilters({
                age: f.age || undefined,
                gender: f.gender || "",
                hobbies: Array.isArray(f.hobbies) ? f.hobbies : [],
              });
              setActiveFilter(false);
            }}
            onClear={() =>
              setFilters({ age: undefined, gender: "", hobbies: [] })
            }
            onClose={() => setActiveFilter(false)}
          />
        </PageContainer>
      </div>
    </PageBackground>
  );
}
