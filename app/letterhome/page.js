"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import Link from "next/link";
import { db, auth } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from 'next/navigation';
import { FaUserCircle } from "react-icons/fa";
import BottomNavBar from "../../components/bottom-nav-bar";
import { fetchLetterboxes, fetchDraft, fetchLetterbox, fetchRecipients } from "../utils/letterUtils";

export default function Home() {
  const [userName, setUserName] = useState("");
  const [country, setCountry] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [letters, setLetters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeLetter, setActiveLetter] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      if (!auth.currentUser) return;
      
      try {
        const docRef = doc(db, "users", auth.currentUser.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const userData = docSnap.data();
          setUserName(userData.first_name || "Unknown User");
          setCountry(userData.country || "Unknown Country");
          setProfileImage(userData?.photo_uri || "");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setError("Failed to load user data");
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError("");

      try {
        const letterboxes = await fetchLetterboxes();
        const letterboxIds = letterboxes.map((l) => l.id);
        
        const letterPromises = letterboxIds.map(async (id) => {
          const letterbox = { id };
          const userRef = doc(db, "users", auth.currentUser.uid);
          
          const draft = await fetchDraft(id, userRef, true);
          letterbox.letters = draft ? [draft] : await fetchLetterbox(id, 1);
          
          const recipients = await fetchRecipients(id);
          letterbox.recipients = recipients;
          
          return letterbox;
        });

        const fetchedLetters = await Promise.all(letterPromises);
        setLetters(fetchedLetters);
      } catch (error) {
        console.error("Error fetching letters:", error);
        setError("Failed to load letters");
      } finally {
        setIsLoading(false);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setError("No user logged in.");
        router.push("/login");
        return;
      }
      
      fetchData();
    });

    return () => unsubscribe();
  }, [router]);

  const handleLetterClick = (letter) => {
    setActiveLetter(letter);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen py-6">
      <div className="max-w-lg mx-auto bg-white shadow-md rounded-lg overflow-hidden">
        <div className="flex justify-between items-center bg-gray-100 p-5 border-b border-gray-200">
          <Link href="/profile">
            <button className="flex items-center text-gray-700 hover:bg-gray-200 rounded-lg p-2 transition-colors">
              <FaUserCircle className="h-8 w-8" />
              <div className="ml-3">
                <div className="font-semibold text-lg">{userName}</div>
                <div className="text-sm text-gray-600">{country}</div>
              </div>
            </button>
          </Link>
        </div>
        <div className="p-6">
          <section className="mt-8">
            <h2 className="font-bold text-xl mb-4 text-gray-800">Recent Letters</h2>
            {letters.length > 0 ? (
              letters.map((letter) => (
                <div
                  key={letter.id}
                  className="flex items-center p-4 mb-3 bg-white hover:shadow-lg hover:bg-[#cfe899] border-b border-gray-400 transition-shadow duration-300 cursor-pointer"
                  onClick={() => handleLetterClick(letter)}
                >
                  <div className="w-12 h-12 relative mr-4">
                    <Image
                      src="/usericon.png"
                      alt="Sender"
                      width={48}
                      height={48}
                      className="rounded-full"
                    />
                  </div>
                  <div className="flex-grow">
                    <h3 className="font-semibold text-gray-800">
                      From: {letter.senderName}
                      <span className="text-xs text-gray-400 ml-2">
                        {letter.received}
                      </span>
                    </h3>
                    <p className="text-gray-600 truncate">{letter.content}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No letters found.</p>
            )}
            <button 
              className="mt-4 w-full py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              onClick={() => router.push('/myletters')}
            >
              View All Letters
            </button>
          </section>

          <section className="mt-8">
            <h2 className="font-bold text-xl mb-4 text-gray-800">Your Contacts</h2>
            <div className="grid grid-cols-2 gap-4">
              {letters.map((letter) => (
                <div key={letter.id} className="p-4 border rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold">{letter.senderName}</h3>
                  <p className="text-gray-600">{letter.senderCountry}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
        <BottomNavBar />
      </div>

      {activeLetter && (
        <div 
          className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center ${!!activeLetter ? '' : 'hidden'}`}
          onClick={() => setActiveLetter(null)}
        >
          <div 
            className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-semibold">Letter from {activeLetter.senderName}</h2>
              <button 
                onClick={() => setActiveLetter(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-500">Received: {activeLetter.received}</p>
              <p className="mt-4">{activeLetter.content}</p>
              {activeLetter.attachments && activeLetter.attachments.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold">Attachments:</h4>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {activeLetter.attachments.map((url, index) => (
                      <Image
                        key={index}
                        src={url}
                        alt={`Attachment ${index + 1}`}
                        width={100}
                        height={100}
                        className="object-cover rounded"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

