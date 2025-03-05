"use client";

import { useState, useEffect } from "react";
import { db, auth } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ProfileImage from "@/components/general/ProfileImage";
import BottomNavBar from "@/components/bottom-nav-bar";
import {
    fetchLetterboxes,
    fetchRecipients,
} from "../utils/letterboxFunctions";

export default function LoginProfiles() {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            console.log("Auth state:", user ? "Logged in" : "No user");
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
                        console.log(`Recipients for ${id}:`, recipients);
                        recipients.forEach((rec) => {
                            if (!seenIds.has(rec.id)) {
                                seenIds.add(rec.id);
                                allRecipients.push(rec);
                            }
                        });
                    }

                    console.log("All unique recipients:", allRecipients);
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

    if (isLoading) {
        return <div className="text-center py-10">Loading...</div>;
    }

    if (error) {
        return <div className="text-center py-10 text-red-500">{error}</div>;
    }

    return (
        <div className="bg-white min-h-screen py-6">
            <div className="max-w-lg mx-auto rounded-lg overflow-hidden">
                <section className="p-4 max-w-[260px] m-auto">
                    <div className="flex flex-col gap-[8px] items-center justify-center flex-grow">
                        <h1 className="font-bold text-black text-center font-size-[18px]">
                            Have you used this device to log in before?
                        </h1>
                        <p className="text-black max-w-[300px] text-center font-size-[16px]">
                            Choose a profile
                        </p>
                    </div>

                    <div className="grid grid-cols-3 gap-10">
                        {users.length > 0 ? (
                            users.map((user) => (
                                <div
                                    key={user.id}
                                    className="flex flex-col items-center justify-center py-4 bg-white"
                                >
                                    <div className="relative mt-4">
                                        <Link href={`/profile/${user.id}`} className="flex justify-center">
                                            <div className="h-[75.09px] rounded-full overflow-hidden flex items-center justify-center">
                                                <ProfileImage
                                                    photo_uri={user.photo_uri}
                                                    first_name={user.first_name}
                                                />
                                            </div>
                                        </Link>
                                        <div
                                            className="min-w-[60px] h-[20px] rounded-[15px] bg-[#4E802A] px-[8px] flex items-center justify-center whitespace-nowrap absolute bottom-0 left-1/2 transform -translate-x-1/2 z-10"
                                        >
                                            <h3 className="font-semibold text-[14px] leading-[20px] tracking-[-0.5%] text-white text-center">
                                                {user.first_name.split(" ")[0]} {user.last_name.charAt(0)}.
                                            </h3>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 col-span-3 text-center">
                                No users found.
                            </p>
                        )}
                    </div>

                    <div className="flex justify-center mt-6">
                        <Link href="/user-data-import">
                            <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-400 transition">
                                <span className="text-gray-700 font-bold">+</span>
                            </div>
                        </Link>
                    </div>
                </section>
            </div>
        </div>
    );
}
