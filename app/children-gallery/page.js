"use client";

import {useEffect, useState} from "react";
import {auth} from "../firebaseConfig";
import {onAuthStateChanged} from "firebase/auth";
import {useRouter} from "next/navigation";
import ProfileImage from "@/components/general/ProfileImage";
import {fetchLetterboxes, fetchLetterCountForLetterbox, fetchRecipients} from "../utils/letterboxFunctions";
import LoadingSpinner from "@/components/loadingSpinner/LoadingSpinner";
import Button from "@/components/general/Button";
import bcrypt from "bcryptjs";

export default function ChildrenGallery() {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedUser, setSelectedUser] = useState(null);
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [passwordInput, setPasswordInput] = useState(""); // Add state for password input
    const router = useRouter();

    const maskEmail = (email) => {
        const [localPart, domain] = email.split("@");
        const maskedLocal = localPart[0] + "*".repeat(localPart.length - 1);
        return `${maskedLocal}@${domain}`;
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                setError("No user logged in.");
                setIsLoading(false);
                router.push("/login");
            } else {
                try {
                    console.log("Fetching letterboxes...");
                    const letterboxes = await fetchLetterboxes();
                    const letterboxIds = letterboxes.map((l) => l.id);
                    console.log("Letterbox IDs:", letterboxIds);

                    const allRecipients = [];
                    const seenIds = new Set();

                    for (const id of letterboxIds) {
                        const recipients = await fetchRecipients(id);
                        const letterCount = await fetchLetterCountForLetterbox(id);

                        for (const rec of recipients) {
                            console.log("Recipient data:", rec);
                            if (
                                !seenIds.has(rec.id) &&
                                rec.user_type === "child" &&
                                rec.localVolunteerId === auth.currentUser.uid
                            ) {
                                seenIds.add(rec.id);
                                allRecipients.push({...rec, letterCount});
                            }
                        }
                    }

                    console.log("All unique child recipients for this volunteer:", allRecipients);
                    setUsers(allRecipients);
                } catch (err) {
                    console.error("Error fetching users:", err.message);
                    setError(`Failed to fetch users: ${err.message}`);
                } finally {
                    setIsLoading(false);
                }
            }
        });
        return () => unsubscribe();
    }, [router]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (selectedUser.user_type !== "child") {
                alert("This profile is not a child. Please select a child profile.");
                return;
            }

            const isMatch = await bcrypt.compare(passwordInput, selectedUser.passwordHash);
            if (!isMatch) {
                alert("Incorrect password. Please try again.");
                setPasswordInput(""); // Clear the input for retry
                return;
            }

            if (selectedUser.localVolunteerId !== auth.currentUser.uid) {
                alert("You are not authorized to log in as this child.");
                setSelectedUser(null); // Close modal if unauthorized
                return;
            }

            console.log("Login successful for child:", selectedUser.first_name);
            setSelectedUser(null);
            setError("");
            router.push("/letterhome");
        } catch (err) {
            console.error("Error during login:", err.message);
            alert("Login failed: " + err.message);
            setPasswordInput(""); // Clear input on error
        }
    };

    if (isLoading) {
        return <LoadingSpinner/>;
    }

    if (error) {
        return <div className="text-center py-10 text-red-500">{error}</div>;
    }

    return (
        <div className="bg-white min-h-screen py-10">
            <div className="max-w-lg mx-auto rounded-lg overflow-hidden">
                <section className="p-4 max-w-[260px] m-auto">
                    <div className="flex flex-col gap-[8px] items-center justify-center flex-grow">
                        <h1 className="font-bold text-black text-center font-size-[18px]">
                            Have you used this device to log in before?
                        </h1>
                        <p className="text-black max-w-[300px] text-center font-size-[16px]">
                            Choose a child profile
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
                                                {user.first_name.split(" ")[0]} {user.last_name.charAt(0)}.
                                            </h3>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 col-span-3 text-center">No child profiles found.</p>
                        )}
                    </div>
                </section>
            </div>

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
                                    <label htmlFor="volunteerEmail" className="block text-sm font-medium text-gray-700">
                                        Device owner’s email
                                    </label>
                                    <input
                                        type="text"
                                        id="volunteerEmail"
                                        value={auth.currentUser ? maskEmail(auth.currentUser.email) : ""}
                                        readOnly
                                        className="w-full border-0 border-b border-black py-2 px-3 text-black focus:outline-none focus:border-[#4E802A]"
                                    />
                                </div>
                                <div className="mb-4 relative">
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                        Child Password
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
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor"
                                                 viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor"
                                                 viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                <div className="mt-6 flex justify-center">
                                    <Button
                                        color={"bg-[#4E802A]"}
                                        btnText={"Log in"}
                                        textColor={"text-white"}
                                        btnType="submit"
                                    />
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
