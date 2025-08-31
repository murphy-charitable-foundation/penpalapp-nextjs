"use client";

import {useEffect, useState} from "react";
import {auth, db} from "../firebaseConfig";
import {onAuthStateChanged} from "firebase/auth";
import {useRouter} from "next/navigation";
import {collection, doc, getDoc, getDocs, query, where} from "firebase/firestore";
import ProfileImage from "../../components/general/ProfileImage";
import {fetchLetterboxes, fetchLetterCountForLetterbox, fetchRecipients} from "../utils/letterboxFunctions";
import LoadingSpinner from "../../components/loading/LoadingSpinner";
import Button from "../../components/general/Button";
import bcrypt from "bcryptjs";
import { PageBackground } from "../../components/general/PageBackground";
import { PageContainer }  from "../../components/general/PageContainer";
import Input from  "../../components/general/Input";

export default function ChildrenGallery() {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedUser, setSelectedUser] = useState(null);
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [passwordInput, setPasswordInput] = useState("");
    const [volunteerName, setVolunteerName] = useState("");
    const router = useRouter();


    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                setError("You must be logged in to access this page.");
                setIsLoading(false);
                router.push("/login");
                return;
            }

            const volunteerId = user.uid;
            console.log("volunteerId:", volunteerId);

            try {
                const userRef = doc(db, "users", volunteerId);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    const {first_name, last_name} = userSnap.data();
                    setVolunteerName(`${first_name} ${last_name.charAt(0)}.`);
                } else {
                    console.warn("Volunteer document not found");
                    setVolunteerName("Volunteer");
                }

                const childrenQuery = query(
                    collection(db, "users"),
                    where("user_type", "==", "child"),
                    where("localVolunteerId", "==", volunteerId)
                );
                const childrenSnapshot = await getDocs(childrenQuery);
                const allChildren = childrenSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));

                const letterboxes = await fetchLetterboxes();
                console.log("Letterboxes:", letterboxes);

                // Create a map of letterboxId to recipients
                const letterboxRecipientMap = {};
                for (const letterbox of letterboxes) {
                    const recipients = await fetchRecipients(letterbox.id);
                    console.log(`Recipients for ${letterbox.id}:`, recipients);

                    for (const recipient of recipients) {
                        letterboxRecipientMap[recipient.id] = {
                            letterboxId: letterbox.id,
                        };
                    }
                }

                // Fetch children with their letter counts
                const childrenWithLetters = await Promise.all(
                    allChildren.map(async (child) => {
                        const match = letterboxRecipientMap[child.id];
                        let letterCount = 0;

                        if (match) {
                            letterCount = await fetchLetterCountForLetterbox(match.letterboxId);
                            console.log(`Letter count for ${child.first_name}:`, letterCount);
                        }

                        return {
                            ...child,
                            letterCount,
                        };
                    })
                );

                console.log("Children with letters:", childrenWithLetters);
                setUsers(childrenWithLetters);
            } catch (err) {
                console.error("Error fetching children:", err.message);
                setError(`Error fetching children: ${err.message}`);
            } finally {
                setIsLoading(false);
            }
        });

        return () => unsubscribe();
    }, [router]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (selectedUser.user_type !== "child") {
                alert("This user is not a child.");
                return;
            }
      
            const isMatch = await bcrypt.compare(passwordInput, selectedUser.passwordHash);
            if (!isMatch) {
                alert("Wrong password. Please try again.");
                setPasswordInput("");
                return;
            }
           

            if (selectedUser.localVolunteerId !== auth.currentUser.uid) {
                alert("This user is not associated with your account.");
                setSelectedUser(null);
                return;
            }

            console.log("Selected user:", selectedUser.first_name);
            setSelectedUser(null);
            setError("");
            localStorage.setItem('child', JSON.stringify(selectedUser));
            router.push("/letterhome");
        } catch (err) {
            alert("Error logging in: " + err.message);
            setPasswordInput("");
        }
    };

    if (isLoading) {
        return <LoadingSpinner/>;
    }

    if (error) {
        return <div className="text-center py-10 text-red-500">{error}</div>;
    }

    return (
        <PageBackground>
            <PageContainer max-width={"md"} padding={"p-8"}>
                <section className="p-4 max-w-[260px] m-auto">
                    <div className="flex flex-col gap-[8px] items-center justify-center flex-grow">
                        <h1 className="font-bold text-black text-center font-size-[18px]">
                            Have you used this device to log in before?
                        </h1>
                        <p className="text-black max-w-[300px] text-center font-size-[16px]">
                            Choose a profile
                        </p>
                    </div>

                    <div className="grid grid-cols-3 gap-x-10">
                        {users.length > 0 ? (
                            users.map((user) => (
                                <div
                                    key={user.id}
                                    className="flex flex-col items-center justify-center bg-white cursor-pointer"
                                    onClick={() => setSelectedUser(user)}
                                >
                                    <div className="relative mt-4">
                                        <div
                                            className="h-[75.09px] rounded-full overflow-hidden flex items-center justify-center">
                                            <ProfileImage photo_uri={user.photo_uri} first_name={user.first_name}/>
                                        </div>
                                        {user.letterCount > 0 && (
                                            <span
                                                className="absolute top-0 right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                                                {user.letterCount}
                                            </span>
                                        )}
                                        <div
                                            className="min-w-[60px] h-[20px] rounded-[15px] bg-[#4E802A] px-[8px] flex items-center justify-center whitespace-nowrap absolute bottom-0 left-1/2 transform -translate-x-1/2 z-10">
                                            <h3 className="font-semibold text-[14px] leading-[20px] tracking-[-0.5%] text-white text-center">
                                            {user.first_name?.split(" ")[0] || ""} {user.last_name?.split(" ")[0] || ""}
                                            </h3>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 col-span-3 text-center">No children found</p>
                        )}
                    </div>
                </section>
            </PageContainer>

            {selectedUser && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white p-5 rounded-md shadow-lg max-w-sm w-full relative">
                        <button
                            className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
                            onClick={() => setSelectedUser(null)}
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                 xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                      d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>
                        <div className="flex flex-col items-center">
                            <figure className="relative flex flex-col items-center mb-11">
                                <div className="h-[75.09px] w-[75.09px] rounded-full overflow-hidden">
                                    <ProfileImage photo_uri={selectedUser.photo_uri}
                                                  first_name={selectedUser.first_name}/>
                                </div>
                                <figcaption
                                    className="min-w-[60px] h-[20px] rounded-[15px] bg-[#4E802A] px-[8px] flex items-center justify-center whitespace-nowrap absolute bottom-0 left-1/2 transform -translate-x-1/2 z-10">
                                    <h3 className="font-semibold text-[14px] leading-[20px] tracking-[-0.5%] text-white text-center">
                                        {selectedUser.first_name} {selectedUser.last_name}
                                    </h3>
                                </figcaption>
                            </figure>
                            <form className="w-full" onSubmit={handleSubmit}>
                                <div className="mb-4">
                                    <p className="block text-sm font-medium text-gray-700">
                                        Local Volunteer: {volunteerName || "Volunteer"}
                                    </p>
                                </div>
                                <div className="mb-4 relative">
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                        Password
                                    </label>
                                    <input
                                        type={passwordVisible ? "text" : "password"}
                                        id="password"
                                        name="password"
                                        value={passwordInput}
                                        onChange={(e) => setPasswordInput(e.target.value)}
                                        className="w-full border-0 border-b border-black py-2 px-3 text-black focus:outline-none focus:border-[#4E802A]"
                                        placeholder="Password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-2 top-1/2 transform translate-y-1 text-gray-600"
                                        onClick={() => setPasswordVisible(!passwordVisible)}
                                    >
                                        {passwordVisible ? (
                                            <svg width="22" height="16" viewBox="0 0 22 16" fill="none"
                                                 xmlns="http://www.w3.org/2000/svg">
                                                <path
                                                    d="M11 2.5C14.79 2.5 18.17 4.63 19.82 8C18.17 11.37 14.79 13.5 11 13.5C7.21 13.5 3.83 11.37 2.18 8C3.83 4.63 7.21 2.5 11 2.5ZM11 0.5C6 0.5 1.73 3.61 0 8C1.73 12.39 6 15.5 11 15.5C16 15.5 20.27 12.39 22 8C20.27 3.61 16 0.5 11 0.5ZM11 5.5C12.38 5.5 13.5 6.62 13.5 8C13.5 9.38 12.38 10.5 11 10.5C9.62 10.5 8.5 9.38 8.5 8C8.5 6.62 9.62 5.5 11 5.5ZM11 3.5C8.52 3.5 6.5 5.52 6.5 8C6.5 10.48 8.52 12.5 11 12.5C13.48 12.5 15.5 10.48 15.5 8C15.5 5.52 13.48 3.5 11 3.5Z"
                                                    fill="#11181C"/>
                                            </svg>

                                        ) : (
                                            <svg width="22" height="16" viewBox="0 0 22 16" fill="none"
                                                 xmlns="http://www.w3.org/2000/svg">
                                                <path d="M2 2L20 14" stroke="#11181C" strokeWidth="1.5"
                                                      strokeLinecap="round"/>
                                                <path
                                                    d="M11 2.5C14.79 2.5 18.17 4.63 19.82 8C18.17 11.37 14.79 13.5 11 13.5C7.21 13.5 3.83 11.37 2.18 8C3.83 4.63 7.21 2.5 11 2.5ZM11 0.5C6 0.5 1.73 3.61 0 8C1.73 12.39 6 15.5 11 15.5C16 15.5 20.27 12.39 22 8C20.27 3.61 16 0.5 11 0.5ZM11 5.5C12.38 5.5 13.5 6.62 13.5 8C13.5 9.38 12.38 10.5 11 10.5C9.62 10.5 8.5 9.38 8.5 8C8.5 6.62 9.62 5.5 11 5.5ZM11 3.5C8.52 3.5 6.5 5.52 6.5 8C6.5 10.48 8.52 12.5 11 12.5C13.48 12.5 15.5 10.48 15.5 8C15.5 5.52 13.48 3.5 11 3.5Z"
                                                    fill="#11181C"/>
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                <div className="mt-6 flex justify-center">
                                    <Button color={"green"} btnText={"Log in"} 
                                            btnType="submit"/>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </PageBackground>
    );
}