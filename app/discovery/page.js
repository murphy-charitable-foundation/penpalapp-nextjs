"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import BottomNavBar from "../../components/bottom-nav-bar";
import { PageBackground } from "../../components/general/PageBackground";
import { PageContainer } from "../../components/general/PageContainer";
import Header from "../../components/general/Header";
import FilterPanel from "../../components/discovery/FilterPanel";
import EmptyState from "../../components/discovery/EmptyState";
import KidsList from "../../components/discovery/KidsList";
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
import { db, auth } from "../firebaseConfig"; 
import KidFilter from "../../components/discovery/KidFilter";
import Link from "next/link";
import { BackButton } from "../../components/general/BackButton";
import { logButtonEvent, logError } from "../utils/analytics";
import { usePageAnalytics } from "../useAnalytics";
import { onAuthStateChanged } from "firebase/auth";


const TOP_GAP = 6;
const GAP_BELOW = 2;
const PAGE_SIZE = 10;

// --- mock data (swap with Firestore feed) ---
const MOCK_KIDS = [
  { id: "k1", first_name: "Joan", last_name: "A.", gender: "Female", hobby: ["Reading","Drawing"], date_of_birth: "2012-05-14", photoURL: "/usericon.png", bio: "Learn, play and write kind, consistent, adventurous letters. Quis..." },
  { id: "k2", first_name: "Amir", last_name: "K.", gender: "Male", hobby: ["Football","Music"], date_of_birth: "2011-08-02", photoURL: "/usericon.png", bio: "Curious about music and science." },
  { id: "k3", first_name: "Sara", last_name: "N.", gender: "Female", hobby: ["Chess","Coding"], date_of_birth: "2013-02-20", photoURL: "/usericon.png", bio: "Enjoys reading and puzzles." },
];

function calculateAge(dob) {
  if (!dob) return "";
  const d = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return String(age);
}

export default function Discovery() {
  // bottom nav height measurement
  const [navH, setNavH] = useState(88);
  const navWrapRef = useRef(null);

  useLayoutEffect(() => {
    const el = navWrapRef.current;
    if (!el) return;
    const update = () => setNavH(el.offsetHeight || 88);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  // filter state
  const [activeFilter, setActiveFilter] = useState(false);
  const [filters, setFilters] = useState({ age: undefined, gender: "", hobbies: [] });

  // data + pagination
  const [allKids] = useState(MOCK_KIDS);
  const [visibleKids, setVisibleKids] = useState([]);
  const [cursor, setCursor] = useState(0);
  const [loading, setLoading] = useState(false);

  const filteredKids = useMemo(() => {
    return allKids.filter((k) => {
      if (filters.gender && k.gender !== filters.gender) return false;
      if (typeof filters.age === "number" && filters.age > 0) {
        const kidAge = Number(calculateAge(k.date_of_birth));
        if (kidAge !== filters.age) return false;
      }
      if (filters.hobbies && filters.hobbies.length > 0) {
        const hv = new Set((k.hobby || []).map(String));
        const allIn = filters.hobbies.every((h) => hv.has(String(h)));
        if (!allIn) return false;
      }
      return true;
    });
  }, [allKids, filters]);

  useEffect(() => {
    setCursor(0);
    setVisibleKids(filteredKids.slice(0, PAGE_SIZE));
  }, [filteredKids]);

  const loadMoreKids = () => {
    if (loading) return;
    setLoading(true);
    setTimeout(() => {
      const next = filteredKids.slice(cursor + PAGE_SIZE, cursor + 2 * PAGE_SIZE);
      setVisibleKids((prev) => [...prev, ...next]);
      setCursor((c) => c + PAGE_SIZE);
      setLoading(false);
    }, 250);
  };

  const hasMore = cursor + PAGE_SIZE < filteredKids.length;

  const onClearFilters = () => {
    setFilters({ age: undefined, gender: "", hobbies: [] });
  };

  const applyFilters = (f) => {
    setFilters({
      age: f.age && f.age > 0 ? f.age : undefined,
      gender: f.gender || "",
      hobbies: Array.isArray(f.hobbies) ? f.hobbies : [],
    });
    setActiveFilter(false);
  };

return (
  <PageBackground className="bg-gray-100 min-h-[103dvh] overflow-hidden flex flex-col">
    <div className="flex-1 min-h-0" style={{ paddingTop: TOP_GAP }}>
      <div
        className="relative mx-auto w-full max-w-[29rem] rounded-2xl overflow-hidden shadow-lg flex flex-col min-h-0"
        style={{
          height: `calc(103dvh - ${navH}px - ${TOP_GAP}px - ${GAP_BELOW}px - env(safe-area-inset-bottom,0px))`,
        }}
      >
        <PageContainer
          width="compactXS"
          padding="none"
          bg="bg-white"
          scroll={false}
          viewportOffset={0}
          className="p-0 flex-1 min-h-0 flex flex-col overflow-hidden"
        >
          <div
            className="relative flex-1 min-h-0 overflow-y-auto overscroll-contain"
            style={{
              WebkitOverflowScrolling: "touch",
              paddingBottom: `calc(${navH}px + ${GAP_BELOW}px + env(safe-area-inset-bottom,0px))`,
            }}
          >
            <Header activeFilter={activeFilter} setActiveFilter={setActiveFilter} />

            <div className="px-4 pb-4 w-full max-w-full">
              {visibleKids.length === 0 ? (
                <EmptyState onClear={onClearFilters} />
              ) : (
                <KidsList
                  kids={visibleKids}
                  calculateAge={calculateAge}
                  lastKidDoc={hasMore}
                  loadMoreKids={loadMoreKids}
                  loading={loading}
                />
              )}
            </div>

            {/* FILTER PANEL */}
            <FilterPanel
              open={activeFilter}
              initial={{
                age: filters.age ?? 0,
                gender: filters.gender ?? "",
                hobbies: filters.hobbies ?? [],
              }}
              onApply={applyFilters}
              onClear={onClearFilters}
              onClose={() => setActiveFilter(false)}
            />

          </div>
        </PageContainer>
      </div>
    </div>

    {/* NAVBAR */}
    <div ref={navWrapRef}>
      <BottomNavBar />
    </div>
  </PageBackground>
);


}
