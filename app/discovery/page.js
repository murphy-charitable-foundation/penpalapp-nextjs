"use client";

// import Image from 'next/image';
// import Link from 'next/link';
// import { useState, useEffect, useRef } from 'react';
// import { db } from '../firebaseConfig'; // Ensure this path is correct
// import { collection, getDocs } from 'firebase/firestore';
// import { differenceInCalendarYears } from 'date-fns';
// import BottomNavBar from '@/components/bottom-nav-bar';
// import KidCard from '@/components/general/KidCard';

// export default function ChooseKid() {
//     const [kids, setKids] = useState([]);

//     useEffect(() => {
//         const fetchKids = async () => {
//             const usersCollectionRef = collection(db, "users");
//             const snapshot = await getDocs(usersCollectionRef);
//             const kidsList = snapshot.docs.map(doc => ({
//                 id: doc.id,
//                 ...doc.data(),
//             }));
//             console.log(kidsList)
//             setKids(kidsList);
//         };

//         fetchKids();
//     }, []);

//     function calculateAge(birthday) {
//         return differenceInCalendarYears(new Date(), new Date(birthday));
//     }

//     return (
//         <div className="min-h-screen p-4" style={{ backgroundColor: '#f0f2f5' }}>
//             <div className="bg-white shadow-md rounded-lg overflow-hidden">

// <div className="flex flex-col sm:flex-row sm:justify-between sm:bg-[#034078]">
//     {/* Top part with white background and black text */}
//     <div className="p-4 flex items-center justify-between text-black sm:text-white bg-white sm:bg-[#034078]">
//         <div className="flex gap-4 justify-center w-full">
//             <button onClick={() => window.history.back()}>
//                 <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
//                 </svg>
//             </button>
//             <h1 className="text-xl sm:text-2xl font-bold text-center">Choose a kid to write to</h1>
//         </div>
//     </div>

//     {/* Filter button with grey background */}
//     <div className="p-4 bg-[#E6EDF4] sm:bg-[#034078]">
//         <button className="text-black sm:text-white w-full px-3 py-1 rounded-full text-sm flex items-center justify-between sm:justify-center sm:bg-[#022f5b] text-[15px] sm:text-[18px]">
//             <p>Filters</p>
//             <svg className="w-6 h-7 ml-2 fill-current" viewBox="0 0 20 20">
//                 <path d="M5.95 6.95l4 4 4-4 .707.708L10 12.364 5.242 7.657l.707-.707z" />
//             </svg>
//         </button>
//     </div>
// </div>

//         <div className="px-4 py-2 flex flex-row flex-wrap gap-5 justify-center relative">
//         {kids.map((kid) => (
//             <KidCard
//             kid={kid}
//             calculateAge={calculateAge}
//             key={kid?.id}
//             style={{ minHeight: "300px", minWidth: "280px" }} // Adjust min-height and min-width as needed
//             />
//         ))}
//         </div>

//             </div>
//             <BottomNavBar />
//         </div>

//     );
// }

import { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  query,
  startAfter,
  limit,
  where,
  and,
} from "firebase/firestore";
import { db } from "../firebaseConfig"; // Ensure this path is correct
import { differenceInCalendarYears, parseISO } from "date-fns";
import BottomNavBar from "@/components/bottom-nav-bar";
import KidCard from "@/components/general/KidCard";
import KidFilter from "@/components/discovery/KidFilter";

const PAGE_SIZE = 10; // Number of kids per page

export default function ChooseKid() {
  const [activeFilter, setActiveFilter] = useState(false);
  const [kids, setKids] = useState([]);
  const [lastKidDoc, setLastKidDoc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  const [age, setAge] = useState(null);
  const [gender, setGender] = useState(null);
  const [hobbies, setHobbies] = useState(null);

  useEffect(() => {
    fetchKids();
  }, []);

  const fetchKids = async () => {
    setLoading(true);
    console.log("re-filtering");
    console.log(age);
    try {
      const kidsCollectionRef = collection(db, "users");
      //   let q = query(kidsCollectionRef, limit(PAGE_SIZE));
      let q = kidsCollectionRef;

      // Apply filters
      if (age) {
        console.log("Age:", age);
        const currentYear = new Date().getFullYear();
        const minBirthYear = currentYear - age;
        const maxBirthYear = currentYear - age;
        const minBirthDate = new Date(minBirthYear, 0, 1)
          .toISOString()
          .slice(0, 10);
        const maxBirthDate = new Date(maxBirthYear, 11, 31)
          .toISOString()
          .slice(0, 10);
        console.log(minBirthDate);
        console.log("Max Birth Date:", maxBirthDate);

        // q = query(
        //     kidsCollectionRef,
        //     where("birthday", ">=", minBirthDate),
        //     where("birthday", "<=", maxBirthDate),
        //     limit(PAGE_SIZE)
        // );
        q = query(q, where("birthday", ">=", minBirthDate));
        q = query(q, where("birthday", "<=", maxBirthDate));

        // q = query(kidsCollectionRef, where("birthday", "==", "1983-11-09"), limit(PAGE_SIZE))
      }

      q = query(q, limit(PAGE_SIZE));

      //   if (gender) {
      //     q = query(kidsCollectionRef, where("gender", "==", gender), limit(PAGE_SIZE));
      //   }
      //   if (hobbies) {
      //     q = query(kidsCollectionRef, where("hobbies", "array-contains", hobbies), limit(PAGE_SIZE));
      //   }

      if (lastKidDoc && !initialLoad) {
        q = query(q, startAfter(lastKidDoc));
      }
      const snapshot = await getDocs(q);
      const kidsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log(kidsList);
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
      console.error("Error fetching kids:", error);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  function calculateAge(birthday) {
    return differenceInCalendarYears(new Date(), new Date(birthday));
  }

  const filter = async () => {
    setKids([]);
    await setLastKidDoc(null);
    await setInitialLoad(true);
    fetchKids();
    setActiveFilter(false);
    console.log(age);
  };

  const loadMoreKids = () => {
    if (loading) return;
    fetchKids();
  };

  return (
    <div className="min-h-screen p-4 bg-white">
      <div className="bg-white">
        {/* <div className="bg-white shadow-md rounded-lg overflow-hidden"> */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:bg-[#034078]">
          {/* Top part with white background and black text */}
          <div className="p-4 flex items-center justify-between text-black sm:text-white bg-white sm:bg-[#034078]">
            <div className="flex gap-4 justify-center w-full">
              <button onClick={() => window.history.back()}>
                <svg
                  className="h-6 w-6 text-gray-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <h1 className="text-xl sm:text-2xl font-bold text-center">
                Choose a kid to write to
              </h1>
            </div>
          </div>

          {/* Filter button with grey background */}
          <div className="p-4 bg-[#E6EDF4] sm:bg-[#034078]">
            <button
              className="text-black sm:text-white w-full px-3 py-1 rounded-full text-sm flex items-center justify-between sm:justify-center sm:bg-[#022f5b] text-[15px] sm:text-[18px]"
              onClick={() => setActiveFilter(!activeFilter)}
            >
              <p>Filters</p>
              <svg className="w-6 h-7 ml-2 fill-current" viewBox="0 0 20 20">
                <path d="M5.95 6.95l4 4 4-4 .707.708L10 12.364 5.242 7.657l.707-.707z" />
              </svg>
            </button>
          </div>
        </div>

        {activeFilter ? (
          <div className="h-auto">
            <KidFilter
              setAge={setAge}
              setGender={setGender}
              setHobbies={setHobbies}
              filter={filter}
            />
          </div>
        ) : (
          <div>
            <div className="px-4 py-2 flex flex-row flex-wrap gap-5 justify-center relative">
              {kids.map((kid) => (
                <KidCard
                  kid={kid}
                  calculateAge={calculateAge}
                  key={kid?.id}
                  style={{ minHeight: "300px", minWidth: "280px" }}
                />
              ))}
            </div>
            {lastKidDoc && (
              <div className="flex justify-center">
                <button
                  onClick={loadMoreKids}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4"
                >
                  {loading ? "Loading..." : "Load More"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
