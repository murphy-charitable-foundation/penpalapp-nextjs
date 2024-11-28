"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import Link from "next/link";
import { db, auth } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { useRouter } from 'next/navigation';

import { Button } from "../../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../../components/ui/dialog";

import { FaUserCircle } from "react-icons/fa";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import BottomNavBar from "../../components/bottom-nav-bar";

export default function Home() {
  const [userName, setUserName] = useState("");
  const [country, setCountry] = useState("");
  const [letters, setLetters] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeLetter, setActiveLetter] = useState(null);
  const [contacts, setContacts] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      if (auth.currentUser) {
        const uid = auth.currentUser.uid;
        const userDocRef = doc(db, "users", uid);
        const docSnap = await getDoc(userDocRef);

        if (docSnap.exists()) {
          const userData = docSnap.data();
          setUserName(userData.firstName || "Unknown User");
          setCountry(userData.country || "Unknown Country");
        } else {
          console.log("No such document!");
        }
      } else {
        console.log("No user logged in");
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
            const q = query(
              lettersRef,
              where("recipientId", "==", user.uid)
            );
            const querySnapshot = await getDocs(q);

            const fetchedLetters = await Promise.all(querySnapshot.docs.map(async (docSnapshot) => {
              const letterData = docSnapshot.data();
              const senderDocRef = doc(db, "users", letterData.senderId);
              const senderDocSnap = await getDoc(senderDocRef);
              const senderData = senderDocSnap.data();
              return {
                id: docSnapshot.id,
                ...letterData,
                received: letterData.timestamp.toDate().toLocaleString(),
                senderName: senderData?.firstName || "Unknown",
                senderCountry: senderData?.country || "Unknown Country"
              };
            }));

            const sortedLetters = fetchedLetters
              .sort((a, b) => b.timestamp.toDate() - a.timestamp.toDate())
              .slice(0, 3);

            setLetters(sortedLetters);

            const contactsSet = new Set(fetchedLetters.map(letter => letter.senderId));
            const contactsData = await Promise.all(
              Array.from(contactsSet).map(async (senderId) => {
                const senderDocRef = doc(db, "users", senderId);
                const senderDocSnap = await getDoc(senderDocRef);
                const senderData = senderDocSnap.data();
                return {
                  id: senderId,
                  name: senderData?.firstName || "Unknown",
                  country: senderData?.country || "Unknown Country"
                };
              })
            );
            setContacts(contactsData);

          } catch (err) {
            console.error("Failed to fetch letters:", err);
          } finally {
            setIsLoading(false);
          }
        };

        fetchLetters();
      } else {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLetterClick = (letter) => {
    setActiveLetter(letter);
  };

  return (
    <div className="bg-gray-100 min-h-screen py-6">
      <Card className="max-w-lg mx-auto shadow-md rounded-lg overflow-hidden">
        <CardHeader className="flex justify-between items-center bg-gray-100 p-5 border-b border-gray-200">
          <Link href="/profile">
            <Button variant="ghost" className="flex items-center text-gray-700">
              <FaUserCircle className="h-8 w-8" />
              <div className="ml-3">
                <div className="font-semibold text-lg">{userName}</div>
                <div className="text-sm text-gray-600">{country}</div>
              </div>
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-6">
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
            <Button 
              variant="outline" 
              className="mt-4 w-full"
              onClick={() => router.push('/inbox')}
            >
              View All Letters
            </Button>
          </section>

          <section className="mt-8">
            <h2 className="font-bold text-xl mb-4 text-gray-800">Your Contacts</h2>
            <div className="grid grid-cols-2 gap-4">
              {contacts.map((contact) => (
                <Card key={contact.id} className="p-4">
                  <CardTitle className="text-lg">{contact.name}</CardTitle>
                  <CardDescription>{contact.country}</CardDescription>
                </Card>
              ))}
            </div>
          </section>
        </CardContent>
        <BottomNavBar />
      </Card>

      {activeLetter && (
        <Dialog open={!!activeLetter} onOpenChange={() => setActiveLetter(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Letter from {activeLetter.senderName}</DialogTitle>
              <DialogDescription>
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
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// {/* Recent Children */}
// <section>
// <h2 className="font-bold text-xl mb-4 text-gray-800">Recent children</h2>
// <div className="flex space-x-4 overflow-auto">
//     {recentChildren.map((child, index) => (
//         <div key={index} className="flex-shrink-0 w-24 h-24 relative">
//             <Image src={child.image} alt={child.name} layout="fill" className="rounded-full shadow-lg" />
//         </div>
//     ))}
// </div>
// </section>

{
  /* Icons */
}
{
  /* <div className="flex items-center space-x-4">
                        <Link href="/settings">
                            <button className="text-gray-700 hover:text-blue-600"><FaCog className="h-7 w-7" /></button>
                        </Link>
                        <Link href="/discover">
                            <button className="text-gray-700 hover:text-blue-600"><FaBell className="h-7 w-7" /></button>
                        </Link>
                        <Link href="/letterwrite">
                            <button className="text-gray-700 hover:text-blue-600"><FaPen className="h-7 w-7" /></button>
                        </Link>
                    </div> */
}
// {/* Meet Some Kids Section */}
// <section className="mt-8 mb-6">
//     <div className="flex justify-between items-center mb-6">
//         <h2 className="font-bold text-xl text-gray-800">Meet Some Kids</h2>
//         <Link href="/discovery">
//             <button className="px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors duration-300">Show All</button>
//         </Link>
//     </div>
//     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
//         {kids.map((kid) => (
//             <div key={kid.id} className="w-full p-4 rounded-lg shadow-md flex flex-col items-center bg-white">
//                 <div className="w-32 h-32 overflow-hidden rounded-full"> {/* Profile image container */}
//                     <Image
//                         src={kid.image || '/usericon.png'}
//                         alt={kid.firstName}
//                         layout="responsive"
//                         width={128}
//                         height={128}
//                         className="object-cover"
//                     />
//                 </div>
//                 <h3 className="mt-3 mb-1 text-lg font-semibold text-gray-900 text-center">{kid.firstName}</h3>
//                 <p className="text-sm text-gray-500">{calculateAge(kid.birthday)} years old</p>
//                 <p className="text-sm text-gray-600 text-center mt-1 mb-2">{kid.bio}</p>
//                 <div className="flex flex-wrap justify-center gap-2 mt-2 mb-4">
//                     {kid.interests?.map((interest, idx) => (
//                         <span key={idx} className="px-3 py-1 text-xs rounded-full bg-blue-200 text-blue-800">
//                             {interest}
//                         </span>
//                     ))}
//                 </div>
//                 <Link href="/letterwrite">
//                     <button className="w-full py-2 px-2 mt-auto bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-900 transition-colors duration-300">
//                         Send a message
//                     </button>
//                 </Link>
//             </div>
//         ))}
//     </div>
// </section>
