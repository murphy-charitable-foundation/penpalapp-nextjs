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
import KidCard from "../../components/general/KidCard";
import KidFilter from "../../components/discovery/KidFilter";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";
import Header from "../../components/general/Header";
import KidsList from "../../components/general/KidsList";

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

  useEffect(() => {
    fetchKids();
  }, [age, gender, hobbies]);

  const fetchKids = async () => {
    setLoading(true);
  
    try {
      const kidsCollectionRef = collection(db, "users");
      let q = query(kidsCollectionRef);
  
      // Apply filters
      if (age > 0) {
        const currentDate = new Date();
        const minBirthDate = new Date(currentDate.getFullYear() - age - 1, currentDate.getMonth(), currentDate.getDate());
        const maxBirthDate = new Date(currentDate.getFullYear() - age, currentDate.getMonth(), currentDate.getDate());
  
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
  
      const kidsList = await Promise.all(snapshot.docs.map(async (doc) => { //Still needed as photo_uri is not currently directly stored under profile
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
          if (error.code === 'storage/object-not-found') {
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
      }));
  
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
    }
  };
  

  function calculateAge(birthdayTimestamp) {
    if (!birthdayTimestamp) return 0; // Handle null/undefined case

    let birthdayDate;
    try {
      // Handle different timestamp formats
      if (birthdayTimestamp instanceof Date) {
        birthdayDate = birthdayTimestamp;
      } else if (typeof birthdayTimestamp.toDate === 'function') {
        // Firebase Timestamp
        birthdayDate = birthdayTimestamp.toDate();
      } else if (birthdayTimestamp._seconds) {
        // Firestore Timestamp
        birthdayDate = new Date(birthdayTimestamp._seconds * 1000);
      } else {
        // Try to parse as date string
        birthdayDate = new Date(birthdayTimestamp);
      }

      if (isNaN(birthdayDate.getTime())) {
        console.error('Invalid date:', birthdayTimestamp);
        return 0;
      }

      const currentDate = new Date();
      const diffInYears = currentDate.getFullYear() - birthdayDate.getFullYear();

      if (
        currentDate.getMonth() < birthdayDate.getMonth() ||
        (currentDate.getMonth() === birthdayDate.getMonth() &&
          currentDate.getDate() < birthdayDate.getDate())
      ) {
        return diffInYears - 1;
      }

      return diffInYears;
    } catch (error) {
      console.error('Error calculating age:', error);
      return 0;
    }
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
        <Header activeFilter={activeFilter} setActiveFilter={setActiveFilter} />

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
  );
}
