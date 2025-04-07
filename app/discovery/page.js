"use client";

import { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  query,
  startAfter,
  limit,
  where,
} from "firebase/firestore";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import { db } from "../firebaseConfig"; // Ensure this path is correct
import { differenceInCalendarYears, parseISO } from "date-fns";
import KidCard from "@/components/general/KidCard";
import KidFilter from "@/components/discovery/KidFilter";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";
import { logButtonEvent, logLoadingTime } from "@/app/firebaseConfig";
import { usePageAnalytics } from "@/app/utils/useAnalytics";
const PAGE_SIZE = 10; // Number of kids per page

export default function ChooseKid() {
  const [activeFilter, setActiveFilter] = useState(false);
  const [kids, setKids] = useState([]);
  const [lastKidDoc, setLastKidDoc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  const [age, setAge] = useState(0);
  const [gender, setGender] = useState("");
  const [hobbies, setHobbies] = useState([]);
  usePageAnalytics("/discovery");
  useEffect(() => {
    const startTime = performance.now();
    fetchKids(startTime);
  }, [age, gender, hobbies]);

  const fetchKids = async (startTime) => {
    setLoading(true);

    try {
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
      q = query(q, where("connected_penpals_count", "<=", 3));

      if (lastKidDoc && !initialLoad) {
        q = query(q, startAfter(lastKidDoc));
      }
      q = query(q, limit(PAGE_SIZE));
      const snapshot = await getDocs(q);

      const kidsList = await Promise.all(
        snapshot.docs.map(async (doc) => {
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
      console.error("Error fetching kids:", error);
      Sentry.captureException("Error fetching kids " + error);
    } finally {
      setLoading(false);
      setInitialLoad(false);
      requestAnimationFrame(() => {
        setTimeout(() => {
          const endTime = performance.now();
          const loadTime = endTime - startTime;
          console.log(`Page render time: ${loadTime}ms`);
          logLoadingTime("/discovery", loadTime);
        }, 0);
      });
    }
  };

  function calculateAge(birthdayTimestamp) {
    const timestamp = Date.parse(birthdayTimestamp);
    const birthdayDate = new Date(timestamp);
    const currentDate = new Date();

    // Calculate the difference in years
    const diffInYears = currentDate.getFullYear() - birthdayDate.getFullYear();

    // Adjust the age based on the birth month and day
    if (
      currentDate.getMonth() < birthdayDate.getMonth() ||
      (currentDate.getMonth() === birthdayDate.getMonth() &&
        currentDate.getDate() < birthdayDate.getDate())
    ) {
      return diffInYears - 1;
    }

    return diffInYears;
  }

  const filter = async (age, hobby, gender) => {
    setKids([]);
    setLastKidDoc(null);
    setInitialLoad(true);
    setAge(age);
    setHobbies(hobby);
    setGender(gender);
    setActiveFilter(false);
  };

  const loadMoreKids = () => {
    if (loading) return;
    fetchKids();
  };

  return (
    <div className="min-h-screen p-4 bg-white">
      <div className="bg-white">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:bg-[#034078]  sticky top-0 z-10">
          {/* Top part with white background and black text */}
          <div className="p-4 flex items-center justify-between text-black sm:text-white bg-white sm:bg-[#034078]">
            <div className="flex gap-4 justify-center w-full">
              <Link
                href={"/letterhome"}
                onClick={() =>
                  logButtonEvent("Back button clicked!", "/discovery")
                }
              >
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
              </Link>
              <h1 className="text-xl sm:text-2xl font-bold text-center">
                Choose a kid to write to
              </h1>
            </div>
          </div>

          {/* Filter button with grey background */}
          <div className="p-4 bg-[#E6EDF4] sm:bg-[#034078]">
            <button
              className="text-black sm:text-white w-full px-3 py-1 rounded-full text-sm flex items-center justify-between sm:justify-center sm:bg-[#022f5b] text-[15px] sm:text-[18px]"
              onClick={() => {
                logButtonEvent("Filters button clicked!", "/discovery");
                setActiveFilter(!activeFilter);
              }}
            >
              <p>Filters</p>
              {!activeFilter ? (
                <svg className="w-6 h-7 ml-2 fill-current" viewBox="0 0 20 20">
                  <path d="M5.95 6.95l4 4 4-4 .707.708L10 12.364 5.242 7.657l.707-.707z" />
                </svg>
              ) : (
                <svg className="w-6 h-7 ml-2 fill-current" viewBox="0 0 20 20">
                  <path d="M14.05 13.05l-4-4-4 4-.707-.708L10 7.636l4.758 4.707-.707.707z" />
                </svg>
              )}
            </button>
          </div>
        </div>

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
