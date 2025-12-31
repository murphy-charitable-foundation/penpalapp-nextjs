"use client";
console.log("✅ ADMIN PAGE.JS LOADED", Date.now());


import { useState, useEffect } from "react";
import Link from "next/link";
import { db, auth } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";
import BottomNavBar from "../../components/bottom-nav-bar";

import { collectionGroup, doc, getDoc, getDocs, collection, query, where, limit, startAfter, orderBy } from "firebase/firestore";
import { storage } from "../firebaseConfig.js"; // ✅ Use initialized instance
import { ref as storageRef, getDownloadURL } from "@firebase/storage"; // keep these
import { PageBackground } from "../../components/general/PageBackground";
import { PageContainer } from "../../components/general/PageContainer";
import { BackButton } from "../../components/general/BackButton";
import WelcomeToast from "../../components/general/WelcomeToast";
import { iterateLetterBoxes } from "../utils/deadChat";
import ConversationList from "../../components/general/ConversationList";
import Header from "../../components/general/Header";
import AdminFilter from "../../components/general/admin/AdminFilter";
import AdminLetterReview from "../../components/general/admin/AdminLetterReview";
import AdminRejectModal from "../../components/general/admin/AdminRejectModal";
import ApproveSuccessModal from "../../components/general/admin/ApproveSuccessModal";
import RejectSuccessModal from "../../components/general/admin/RejectSuccessModal";
import { Timestamp, updateDoc } from "firebase/firestore";
import LoadingSpinner from "../../components/loading/LoadingSpinner";
import Button from "../../components/general/Button";
import LetterHomeSkeleton from "../../components/loading/LetterHomeSkeleton";
import { dateToTimestamp } from "../utils/dateHelpers";


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
    const [selectedStatus, setSelectedStatus] = useState("pending_review"); // Default filter
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null); // Optional category filter
    const [showWelcome, setShowWelcome] = useState(false);
    const [activeFilter, setActiveFilter] = useState(false);
    const router = useRouter();
    const [selectedLetter, setSelectedLetter] = useState(null);
    const [showReview, setShowReview] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    // const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showApproveSuccess, setShowApproveSuccess] = useState(false);
    const [showRejectSuccess, setShowRejectSuccess] = useState(false);
    const pendingCount = documents.filter(doc => doc.status === "pending_review").length;
    const searchParams = useSearchParams();
    const showApproveSuccessTest= searchParams.get("approveSuccess") === "true";
    const showRejectSuccessTest= searchParams.get("rejectSuccess") === "true";
    const [authChecked, setAuthChecked] = useState(false);


  const exitReview = () => {
  setShowReview(false);
  setSelectedLetter(null);
  setShowRejectModal(false);
  setShowApproveSuccess(false);
  setShowRejectSuccess(false);
  setSelectedStatus("pending_review");
};

useEffect(() => {
  console.log("🟢 ADMIN PAGE MOUNTED", Date.now());
}, []);


 const handleApprove = async () => {
  if (!selectedLetter) return;

  try {
    await updateDoc(
      doc(db, "letterbox", selectedLetter.letterboxId, "letters", selectedLetter.id),
      {
        status: "sent",
        updated_at: Timestamp.now(),
      }
    );

    setShowReview(false);
    setShowApproveSuccess(true);
  } catch (err) {
    console.error("Approve error:", err);
  }
};


const handleReject = async (reason, feedback) => {
  if (!selectedLetter) return;

  try {
    await updateDoc(
      doc(db, "letterbox", selectedLetter.letterboxId, "letters", selectedLetter.id),
      {
        status: "rejected",
        rejection_reason: reason,
        rejection_feedback: feedback,
        updated_at: Timestamp.now(),
      }
    );

    setShowRejectModal(false);
    setShowRejectSuccess(true);
  } catch (err) {
    console.error("Reject error:", err);
  }

};
    useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        setIsLoading(true);
  
        if (!user) {
          setError("No user logged in.");
          setIsLoading(false);
          router.push("/login");
          return;
        }
        setUserId(user.uid);
        const userRef= doc(collection(db, "users"), user.uid);
        const userSnapshot = await getDoc(userRef);
        if (!userSnapshot.exists()) {
          setError("User profile not found.");
          setIsLoading(false);
          router.push("/login");
          return;
        }      
        const userData = userSnapshot.data();
        console.log("🟣 USER TYPE", userData.user_type);
        if (userData?.user_type != "admin") {
          setError("User is not admin");
          setIsLoading(false);
          router.push("/login");
          return;
        }
        setUserType(userData.user_type);
        setCountry(userData.country);
        setUserName(userData.first_name + " " + userData.last_name);
        const path = `profile/${user.uid}/profile-image`;
        const userPhotoRef = storageRef(storage, path);
        try {
          const userUrl = await getDownloadURL(userPhotoRef);
          setProfileImage(userUrl);
        } catch {
          setProfileImage("/usericon.png");
        }
        
      });
  
      return () => unsubscribe();
    }, [router]);


    useEffect(() => {
      const letterGrab = async() => {
        setIsLoading(true);
        setDocuments([]);
        setLastDoc(null);
        setHasMore(true);
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

    if (!nextPage) {
      setDocuments([]);   // ← Clears duplicates properly
      setLastDoc(null);
    }
    
    let lettersQuery = collectionGroup(db, "letters");

      // 🔹 Apply Filters Dynamically
      const queryConstraints = [where("status", "==", selectedStatus), orderBy("created_at", "desc"), limit(5)];
      
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
            const createdAt =
            docData.created_at ||
            docData.updated_at ||
            Timestamp.now();

            try {
              if (docData.sent_by) {
                const userSnapshot = await getDoc(docData.sent_by); // sent_by must be a DocumentReference
                if (userSnapshot.exists()) {
                  userData = userSnapshot.data();
                  const userId = userSnapshot.id     
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
              letterboxId: doc.ref.parent.parent.id,
              ...docData,
              created_at: createdAt, 
              profileImage: pfp,
              country: userData?.country || "",
              user: userData,
              name : userData ? `${userData.first_name} ${userData.last_name}` : "",
              lastMessage: docData.content,
              lastMessageDate: docData.created_at, 
            };
          })
        );

        
        setDocuments((prev) => {
          const combined = [...prev, ...newDocs];

          // Remove duplicates by letterboxId + id
          const unique = Array.from(
            new Map(
              combined.map(item => [`${item.letterboxId}-${item.id}`, item])
            ).values()
          );

          return unique;
        });

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
    //setLastDoc(null);
    setSelectedStatus(status);
    setStartDate(start);
    setEndDate(end);
    setActiveFilter(false);
  }

    if (isLoading) {
      return <LetterHomeSkeleton/>
    }
    
    return (
       <PageBackground>
        {/* REVIEW SCREEN */}
        {showReview && (
            <AdminLetterReview
            letter={selectedLetter}
            onApprove={handleApprove}
            onReject={() => {
              setShowReview(false);
              setShowRejectModal(true);
            }}
            onClearReview={exitReview}
            onClose={exitReview}
          />

          )}
        {/* REJECT SCREEN */}
        {showRejectModal && (
          <AdminRejectModal
            letter={selectedLetter}
            onSubmit={handleReject}
            onClose={() => { setShowRejectModal(false); setShowReview(true); }}
          />
        )}

        {/* SUCCESS SCREENS */}
            {showApproveSuccess && (
              <ApproveSuccessModal
                onClose={() => setShowApproveSuccess(false)}
              />
            )}

            {showApproveSuccessTest && (
              <ApproveSuccessModal
                onClose={() => setShowApproveSuccess(false)}
              />
            )}

            {showRejectSuccess && (
              <RejectSuccessModal
                onClose={() => setShowRejectSuccess(false)}
              />
            )}

            {showRejectSuccessTest && (
              <RejectSuccessModal
                onClose={() => setShowRejectSuccess(false)}
              />
            )}


    
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
                  filter={filter}
                  loading={isLoading}
                  setLoading={setIsLoading}  />
                
                ) : (
                  <div className="max-w-lg mx-auto bg-white shadow-md rounded-lg pb-6 overflow-hidden">
            
                    <main className="p-6">
                      <section className="mt-8">
                        {!isLoading ? (
                            <ConversationList
                              conversations={documents}
                              onSelectConversation={(conversation) => {
                                setSelectedLetter(conversation);
                                setShowReview(true);
                              }}
                            />
                        ) : (
                          <LetterHomeSkeleton />
                        )}
                      </section>
                  </main>
                  </div>
                )}



                <BottomNavBar />

              {/* Admin-only utility button (temporarily disabled) */}
              {/*
              <Button
                btnText="Check For Inactive Chats"
                color="bg-black"
                textColor="text-white"
                rounded="rounded-md"
                onClick={iterateLetterBoxes}
              />
              */}

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