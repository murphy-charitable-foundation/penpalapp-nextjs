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

                    // Собираем всех уникальных получателей
                    const allRecipients = [];
                    const seenIds = new Set(); // Для отслеживания уникальных ID

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
        <div className="bg-gray-100 min-h-screen py-6">
            <div className="max-w-lg mx-auto bg-white shadow-md rounded-lg overflow-hidden">
                <header className="bg-blue-100 p-5 border-b border-gray-200">
                    <h1 className="text-2xl font-bold text-gray-800 text-center">
                        User Profiles
                    </h1>
                </header>
                <main className="p-6">
                    <section>
                        <div className="grid grid-cols-3 gap-4">
                            {users.length > 0 ? (
                                users.map((user) => (
                                    <Link
                                        key={user.id}
                                        href={`/profile/${user.id}`}
                                        className="flex flex-col items-center p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
                                    >
                                        <ProfileImage
                                            photo_uri={user.photo_uri}
                                            first_name={user.first_name}
                                        />
                                        <div className="mt-2 text-center">
                                            <h3 className="font-semibold text-gray-800">
                                                {user.first_name} {user.last_name}
                                            </h3>
                                            <p className="text-sm text-gray-600">{user.country}</p>
                                        </div>
                                    </Link>
                                ))
                            ) : (
                                <p className="text-gray-500 col-span-3 text-center">
                                    No users found.
                                </p>
                            )}
                        </div>
                    </section>
                </main>
            </div>
        </div>
    );
}
