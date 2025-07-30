"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { db, auth } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import BottomNavBar from '../../components/bottom-nav-bar';

import { collectionGroup, doc, getDoc, getDocs, collection, query, where, limit, startAfter } from "firebase/firestore";
import { storage } from "../firebaseConfig.js"; // ✅ Use initialized instance
import { ref as storageRef, getDownloadURL } from "@firebase/storage"; // keep these


import { PageBackground } from "../../components/general/PageBackground";
import { PageContainer } from "../../components/general/PageContainer";
import EmptyState from "../../components/general/letterhome/EmptyState";
import { BackButton } from "../../components/general/BackButton";
import WelcomeToast from "../../components/general/WelcomeToast";
import ProfileHeader from "../../components/general/letter/ProfileHeader";
import { iterateLetterBoxes } from "../utils/deadChat";
import ConversationList from "../../components/general/ConversationList";
import Header from "../../components/general/Header";
import AdminFilter from "../../components/general/admin/AdminFilter";
import { dateToTimestamp } from "../utils/timestampToDate";

export default function Admin() {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7); // Subtract 7 days

    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1); // Subtract 1 month
    const [userName, setUserName] = useState("");
    const [userId, setUserId] = useState("");
    const [userType, setUserType] = useState("");
    const [country, setCountry] = useState("");
    const [letters, setLetters] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [profileImage, setProfileImage] = useState("");
    const [lastDoc, setLastDoc] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [hasMore, setHasMore] = useState(true);
    const [selectedStatus, setSelectedStatus] = useState("draft"); // Default filter
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null); // Optional category filter
    const [showWelcome, setShowWelcome] = useState(false);
    const [activeFilter, setActiveFilter] = useState(false);
    const router = useRouter();

    useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        setIsLoading(true);
  
        if (!user) {
          setError("No user logged in.");
          setIsLoading(false);
          router.push("/login");
          return;
        }
        console.log("user", user);
        setUserId(user.uid);
        const userRef= doc(collection(db, "users"), user.uid);
        const userSnapshot = getDoc(userRef);
        const userData = (await userSnapshot).data()
        if (userData.user_type != "admin") {
          setError("User is not admin");
          setIsLoading(false);
          router.push("/login");
          return;
        }
        setCountry(userData.country);
        setUserName(userData.first_name + " " + userData.last_name);
        const path = `profile/${user.uid}/profile-image`;
        const userPhotoRef = storageRef(storage, path);
        const userUrl = await getDownloadURL(userPhotoRef);
        setProfileImage(userUrl);
        
      });
  
      return () => unsubscribe();
    }, [router]);

    useEffect(() => {
      const letterGrab = async() => {
        console.log("Start Date", startDate);
        setDocuments([]);
        try {
          // Fetch initial batch of letters
          await fetchLetters();
        } catch (err) {
          console.error("Error fetching data:", err);
          setError("Failed to load data.");
        } finally {
          setIsLoading(false);
        }
      }
      letterGrab();

    }, [selectedStatus, startDate, endDate])


  const fetchLetters = async (nextPage = false) => {
    try {
      let lettersQuery = collectionGroup(db, "letters");

      // 🔹 Apply Filters Dynamically
      const queryConstraints = [where("status", "==", selectedStatus), where("content", "!=", ""), limit(5)];
      
      if (nextPage && lastDoc) {
        queryConstraints.push(startAfter(lastDoc));
      }
      if (startDate) {
        queryConstraints.push(where("created_at", ">=", dateToTimestamp(startDate)));
      }
      if (endDate) {
        queryConstraints.push(where("created_at", "<=", dateToTimestamp(endDate)));
      }

      lettersQuery = query(lettersQuery, ...queryConstraints);
      const querySnapshot = await getDocs(lettersQuery);
      if (!querySnapshot.empty) {
        const newDocs = await Promise.all(
          querySnapshot.docs.map(async (doc) => {
            const docData = doc.data();
            let userData = null;
            let pfp = "/usericon.png"; // default fallback image

            try {
              if (docData.sent_by) {
                const userSnapshot = await getDoc(docData.sent_by); // sent_by must be a DocumentReference
                if (userSnapshot.exists()) {
                  userData = userSnapshot.data();
                  const segments = userSnapshot.ref._key.path.segments; 
                  const userId = segments[segments.length - 1];     
                  const path = `profile/${userId}/profile-image`;
                  const photoRef = storageRef(storage, path);
                  const downloaded = await getDownloadURL(photoRef);
                  pfp = downloaded;
 
                }
              }
            } catch (error) {
              console.error("Error fetching user or photo:", error);
            }
            return {
              id: doc.id,
              ...docData,
              profileImage: pfp,
              country: userData?.country || "",
              user: userData,
              name : userData?.first_name + " " + userData?.last_name || "",
              lastMessage: docData.content,
              lastMessageDate: docData.created_at, 
            };
          })
        );
        console.log("New Docs");
        console.log(newDocs);
        console.log("-----------------");
        setDocuments((prev) => [...prev, ...newDocs]);
        setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1]); // Store last doc for pagination
      } else {
        setHasMore(false); // No more documents to load
      }
    } catch (err) {
      console.error("Error fetching more letters:", err);
      setError("Failed to load more data.");
    }
  };

  const filter = (status, start, end ) => {
    setSelectedStatus(status);
    setStartDate(start);
    setEndDate(end);
    setActiveFilter(false);
  }

    if (documents == null) {
      return <p>Loading....</p>
    }
    
    return (
        <PageBackground>
              <PageContainer maxWidth="lg">
              <BackButton />
              <Header activeFilter={activeFilter} setActiveFilter={setActiveFilter} title={"Select message types"}/>
            
             
              
              <WelcomeToast 
                userName={userName}
                isVisible={showWelcome}
                onClose={() => setShowWelcome(false)}
              />
              {activeFilter ? (
                  <AdminFilter setStatus={setSelectedStatus} 
                  status={selectedStatus} 
                  setStart={setStartDate} 
                  start={startDate} 
                  setEnd={setEndDate} 
                  end={endDate}
                  filter={filter} />
                
                ) : (
                  <div className="max-w-lg mx-auto bg-white shadow-md rounded-lg overflow-hidden">
                    <ProfileHeader 
                      userName={userName}
                      country={country}
                      profileImage={profileImage}
                      id={userId}
                    />
            
                    <main className="p-6">
                      <section className="mt-8">
                        <h2 className="text-xl mb-4 text-gray-800 flex justify-between items-center">
                          Recent letters
                        </h2>
                        {documents.length > 0 ? (
                          <ConversationList conversations={documents}/>
                        ) : (
                          <EmptyState 
                            title="New friends are coming!"
                            description="Many friends are coming hang tight!"
                          />
                        )}
                      </section>
                  </main>
                  </div>
                )}
                <BottomNavBar />

        
              {userType === "admin" && (
                <Button
                  btnText="Check For Inactive Chats"
                  color="bg-black"
                  textColor="text-white"
                  rounded="rounded-md"
                  onClick={iterateLetterBoxes}
                />
              )}
              
              {/* Add animation keyframes */}
              <style jsx global>{`
                @keyframes slideIn {
                  from {
                    opacity: 0;
                    transform: translateX(30px);
                  }
                  to {
                    opacity: 1;
                    transform: translateX(0);
                  }
                }
                .animate-slide-in {
                  animation: slideIn 0.3s ease-out forwards;
                }
              `}</style>
              </PageContainer>
            </PageBackground>
          );
}