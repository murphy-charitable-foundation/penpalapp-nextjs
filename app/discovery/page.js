"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";

import { PageContainer } from "../../components/general/PageContainer";
import { BackButton } from "../../components/general/BackButton";
import BottomNavBar from "../../components/bottom-nav-bar";
import Header from "../../components/general/Header";
import KidFilter from "../../components/discovery/KidFilter";
import KidsList from "../../components/discovery/KidsList";

// ---- layout constants (match your other pages) ----
const NAV_H = 88;
const TOP_GAP_PX = 2;
const FUDGE_PX = 14;

const PAGE_SIZE = 10;

// -------- 10 mock kids --------
const MOCK_KIDS = [
  { id: "k1",  first_name: "Joan",   last_name: "A.", gender: "Female", hobby: ["Football", "Basketball"], date_of_birth: "2012-05-14", photoURL: "/usericon.png", bio: "Loves reading and drawing." },
  { id: "k2",  first_name: "Sam",    last_name: "K.", gender: "Male",   hobby: ["Drawing", "Reading"],     date_of_birth: "2011-11-02", photoURL: "/usericon.png", bio: "Enjoys science and music." },
  { id: "k3",  first_name: "Amina",  last_name: "B.", gender: "Female", hobby: ["Music", "Football"],       date_of_birth: "2014-01-29", photoURL: "/usericon.png", bio: "Curious and kind." },
  { id: "k4",  first_name: "Brian",  last_name: "T.", gender: "Male",   hobby: ["Chess", "Coding"],         date_of_birth: "2010-07-10", photoURL: "/usericon.png", bio: "Future engineer." },
  { id: "k5",  first_name: "Grace",  last_name: "N.", gender: "Female", hobby: ["Reading", "Painting"],     date_of_birth: "2013-03-03", photoURL: "/usericon.png", bio: "Creative and patient." },
  { id: "k6",  first_name: "David",  last_name: "M.", gender: "Male",   hobby: ["Basketball", "Running"],   date_of_birth: "2012-09-18", photoURL: "/usericon.png", bio: "Team player." },
  { id: "k7",  first_name: "Lydia",  last_name: "C.", gender: "Female", hobby: ["Drawing", "Dance"],        date_of_birth: "2015-12-22", photoURL: "/usericon.png", bio: "Loves to dance." },
  { id: "k8",  first_name: "Peter",  last_name: "R.", gender: "Male",   hobby: ["Football", "Music"],       date_of_birth: "2011-06-07", photoURL: "/usericon.png", bio: "Big football fan." },
  { id: "k9",  first_name: "Nora",   last_name: "S.", gender: "Female", hobby: ["Reading", "Coding"],       date_of_birth: "2010-10-15", photoURL: "/usericon.png", bio: "Enjoys puzzles." },
  { id: "k10", first_name: "Thomas", last_name: "J.", gender: "Male",   hobby: ["Running", "Chess"],        date_of_birth: "2013-04-25", photoURL: "/usericon.png", bio: "Fast runner." },
];

// age helper
function calculateAge(dobLike) {
  if (!dobLike) return 0;
  const d = new Date(dobLike);
  if (Number.isNaN(d.getTime())) return 0;
  const now = new Date();
  let y = now.getFullYear() - d.getFullYear();
  const beforeBirthday =
    now.getMonth() < d.getMonth() ||
    (now.getMonth() === d.getMonth() && now.getDate() < d.getDate());
  if (beforeBirthday) y -= 1;
  return y;
}

export default function DiscoveryPage() {
  const [activeFilter, setActiveFilter] = useState(false);
  const [age, setAge] = useState(0);
  const [gender, setGender] = useState("");
  const [hobbies, setHobbies] = useState([]);

  const [kids, setKids] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const filtered = useMemo(() => {
    let list = [...MOCK_KIDS];
    if (age && Number(age) > 0) {
      list = list.filter((k) => calculateAge(k.date_of_birth) === Number(age));
    }
    if (gender) {
      list = list.filter(
        (k) => (k.gender || "").toLowerCase() === gender.toLowerCase()
      );
    }
    if (hobbies && hobbies.length) {
      list = list.filter(
        (k) => Array.isArray(k.hobby) && k.hobby.some((h) => hobbies.includes(h))
      );
    }
    return list;
  }, [age, gender, hobbies]);

  useEffect(() => {
    setLoading(true);
    const end = 10 * page;
    const slice = filtered.slice(0, end);
    const t = setTimeout(() => {
      setKids(slice);
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

 return (
    <div className="bg-gray-100 h-screen overflow-hidden flex flex-col">
      {/* Back button OUTSIDE the card */}
      <div className="fixed left-3 top-3 z-50 md:left-5 md:top-5">
        <BackButton btnType="button" color="transparent" textColor="text-gray-700" size="xs" />
      </div>

      <div className="flex-1 overflow-hidden" style={{ paddingTop: `${TOP_GAP_PX}px` }}>
        <div
          className="mx-auto w-full max-w-[29rem] rounded-lg shadow-lg overflow-hidden"
          style={{ height: `calc(100dvh - ${NAV_H}px - ${TOP_GAP_PX}px + ${FUDGE_PX}px)` }}
        >
          <PageContainer width="compactXS" padding="none" bg="bg-white" scroll={false}
            viewportOffset={NAV_H} className="p-0 h-full min-h-0 overflow-hidden"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            <div className="h-full min-h-0 overflow-y-auto">
              {/* Header FIRST, no outer padding */}
              <Header activeFilter={activeFilter} setActiveFilter={setActiveFilter} />

              {/* content area keeps its own padding */}
              <div className="px-4 pt-3 pb-24">
                {activeFilter ? (
                  <KidFilter
                    setAge={setAge}
                    setGender={setGender}
                    setHobbies={setHobbies}
                    hobbies={hobbies}
                    age={age}
                    gender={gender}
                    filter={applyFilter}
                  />
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
        </div>
      </div>

      <BottomNavBar />
    </div>
  );
}
