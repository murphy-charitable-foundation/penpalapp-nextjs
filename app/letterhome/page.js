"use client";

// pages/index.js
import Image from "next/image";
import { useState, useEffect } from "react";
import Link from "next/link";
import { db, auth } from "../firebaseConfig"; // Adjust the import path as necessary
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore";
import { differenceInCalendarYears } from "date-fns";
import BottomNavBar from "@/components/bottom-nav-bar";
import * as Sentry from "@sentry/nextjs";

import {
  FaUserCircle,
  FaRegEnvelope,
  FaCompass,
  FaInfoCircle,
  FaPhone,
  FaDonate,
  FaCog,
  FaBell,
  FaPen,
  FaUserAlt,
  FaHandHoldingHeart,
  FaInfo,
  FaEnvelopeOpenText,
} from "react-icons/fa";

export default function Home() {
  // Dummy data for the lists
  const recentChildren = [
    { name: "Louise", image: "/usericon.png" },
    { name: "Mark", image: "/usericon.png" },
    { name: "Pierre", image: "/usericon.png" },
    { name: "John", image: "/usericon.png" },
  ];

  const [meetKids, setMeetKids] = useState([]);

  const [kids, setKids] = useState([]);

  useEffect(() => {
    const fetchKids = async () => {
      try {
        const usersCollectionRef = collection(db, "users");
        const q = query(usersCollectionRef, limit(4));
        const snapshot = await getDocs(q);
        const kidsList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setKids(kidsList);
      } catch (error) {
        console.error("Error with fetching kids. Error " + error);
        Sentry.captureException("Error fetching kids " + error);
      }
    };

    fetchKids();
  }, []);

  function calculateAge(birthday) {
    return differenceInCalendarYears(new Date(), new Date(birthday));
  }

  const [userName, setUserName] = useState("");
  const [country, setCountry] = useState("");
  const [lastLetters, setLastLetters] = useState([]);
  const [letters, setLetters] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (auth.currentUser) {
          const uid = auth.currentUser.uid;
          const docRef = doc(db, "users", uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const userData = docSnap.data();
            // Assuming the user's name is stored under a 'name' field. Adjust as necessary.
            setUserName(userData.firstName || "Unknown User"); // You can adjust this line to concatenate firstName and lastName if you want
            setCountry(userData.country || "Unknown Country");
          } else {
            console.log("No such document!");
          }
        } else {
          console.log("No user logged in");
          // If you want to redirect to login, ensure you have access to a router or history object here
          // router.push('/login');
        }
      } catch (error) {
        console.log("Error fetching userdata. Error " + error);
        Sentry.captureException("Error fetching user data. " + error);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const fetchLetters = async () => {
          try {
            const lettersRef = collection(db, "letters");
            const q = query(lettersRef, where("recipientId", "==", user.uid));
            const querySnapshot = await getDocs(q);

            const fetchedLetters = querySnapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
              received: doc.data().timestamp.toDate().toLocaleString(),
            }));

            setLetters(fetchedLetters);
          } catch (err) {
            setError("Failed to fetch letters. Please try again later.");
            Sentry.captureException("Error fetching letters. " + err);
            console.error(err);
          } finally {
            setIsLoading(false);
          }
        };

        fetchLetters();
      } else {
        setError("No user logged in.");
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);
  // This empty dependency array means the effect runs once on component mount.

  return (
    <div className="bg-gray-100 min-h-screen py-6">
      <div className="max-w-lg mx-auto bg-white shadow-md rounded-lg overflow-hidden">
        {/* Header */}
        <header className="flex justify-between items-center bg-blue-100 p-5 border-b border-gray-200">
          {/* User Info */}
          <Link href="/profile">
            <button className="flex items-center text-gray-700">
              <FaUserCircle className="h-8 w-8" />
              <div className="ml-3">
                <div className="font-semibold text-lg">{userName}</div>
                <div className="text-sm text-gray-600">{country}</div>
              </div>
            </button>
          </Link>
          {/* Icons */}
          <div className="flex items-center space-x-4">
            <Link href="/settings">
              <button className="text-gray-700 hover:text-blue-600">
                <FaCog className="h-7 w-7" />
              </button>
            </Link>
            <Link href="/discover">
              <button className="text-gray-700 hover:text-blue-600">
                <FaBell className="h-7 w-7" />
              </button>
            </Link>
            <Link href="/letterwrite">
              <button className="text-gray-700 hover:text-blue-600">
                <FaPen className="h-7 w-7" />
              </button>
            </Link>
          </div>
        </header>
        {/* Main content */}
        <main className="p-6">
          {/* Recent Children */}
          <section>
            <h2 className="font-bold text-xl mb-4 text-gray-800">
              Recent children
            </h2>
            <div className="flex space-x-4 overflow-auto">
              {recentChildren.map((child, index) => (
                <div key={index} className="flex-shrink-0 w-24 h-24 relative">
                  <Image
                    src={child.image}
                    alt={child.name}
                    layout="fill"
                    className="rounded-full shadow-lg"
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Last Letters */}
          <section className="mt-8">
            <h2 className="font-bold text-xl mb-4 text-gray-800 flex justify-between items-center">
              Last letters
              <Link href="/myletters">
                <button className="px-3 py-1 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-300">
                  Show more
                </button>
              </Link>
            </h2>
            {letters.length > 0 ? (
              letters.map((letter) => (
                <div
                  key={letter.id}
                  className="flex items-center p-4 mb-3 rounded-lg bg-white shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer"
                  onClick={() => handleLetterClick(letter)}
                >
                  <div className="w-12 h-12 relative mr-4">
                    <Image
                      src="/usericon.png"
                      alt="Sender"
                      layout="fill"
                      className="rounded-full"
                    />
                  </div>
                  <div className="flex-grow">
                    <h3 className="font-semibold text-gray-800">
                      From: {letter.senderName || "Unknown"}
                    </h3>
                    <p className="text-gray-600 truncate">{letter.content}</p>
                    <span className="text-xs text-gray-400">
                      {letter.received}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No letters found.</p>
            )}
          </section>

          {/* Meet Some Kids Section */}
          <section className="mt-8 mb-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-bold text-xl text-gray-800">
                Meet Some Kids
              </h2>
              <Link href="/discovery">
                <button className="px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors duration-300">
                  Show All
                </button>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
              {kids.map((kid) => (
                <div
                  key={kid.id}
                  className="w-full p-4 rounded-lg shadow-md flex flex-col items-center bg-white"
                >
                  <div className="w-32 h-32 overflow-hidden rounded-full">
                    {" "}
                    {/* Profile image container */}
                    <Image
                      src={kid.image || "/usericon.png"}
                      alt={kid.firstName}
                      layout="responsive"
                      width={128}
                      height={128}
                      className="object-cover"
                    />
                  </div>
                  <h3 className="mt-3 mb-1 text-lg font-semibold text-gray-900 text-center">
                    {kid.firstName}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {calculateAge(kid.birthday)} years old
                  </p>
                  <p className="text-sm text-gray-600 text-center mt-1 mb-2">
                    {kid.bio}
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 mt-2 mb-4">
                    {kid.interests?.map((interest, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 text-xs rounded-full bg-blue-200 text-blue-800"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                  <Link href="/letterwrite">
                    <button className="w-full py-2 px-2 mt-auto bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-900 transition-colors duration-300">
                      Send a message
                    </button>
                  </Link>
                </div>
              ))}
            </div>
          </section>
        </main>
        <BottomNavBar />
      </div>
    </div>
  );
}
