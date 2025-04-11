//temporary file for testing

"use client";

import {useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import {createUserWithEmailAndPassword, onAuthStateChanged} from "firebase/auth";
import {collection, doc, getDocs, query, setDoc, where} from "firebase/firestore";
import {auth, db} from "../firebaseConfig";
import Image from "next/image";
import bcrypt from "bcryptjs";
import * as Sentry from "@sentry/nextjs";
import LoadingSpinner from "@/components/loadingSpinner/LoadingSpinner";

export default function UserDataImport() {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [userType, setUserType] = useState("local_volunteer");
    const [email, setEmail] = useState("");
    const [volunteerId, setVolunteerId] = useState("");
    const [password, setPassword] = useState("");
    const [repeatPassword, setRepeatPassword] = useState("");
    const [volunteers, setVolunteers] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                setError("You must be logged in to access this page.");
                setLoading(false);
                router.push("/login");
                return;
            }
            // Debug UID
            console.log("Current user UID:", user.uid);

            try {
                const q = query(collection(db, "users"), where("user_type", "==", "local_volunteer"));
                const querySnapshot = await getDocs(q);
                const volunteerList = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setVolunteers(volunteerList);
            } catch (error) {
                console.error("Error fetching volunteers:", error);
                Sentry.captureException(error);
                setError("Failed to load volunteers: " + error.message);
            } finally {
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, [router]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if ((userType === "child" || userType === "local_volunteer") && password !== repeatPassword) {
            alert("Passwords do not match.");
            return;
        }

        try {
            let uid;
            let userData = {
                created_at: new Date(),
                first_name: firstName,
                last_name: lastName,
                user_type: userType,
            };

            if (userType === "local_volunteer") {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                uid = userCredential.user.uid;
                userData.email = email;
                userData.connected_penpals = [];
            } else if (userType === "child") {
                uid = `child_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
                const salt = await bcrypt.genSalt(10);
                userData.passwordHash = await bcrypt.hash(password, salt);
                userData.localVolunteerId = volunteerId;
                userData.connected_penpals = [""];
            }

            await setDoc(doc(db, "users", uid), userData);

            alert(`${userType === "child" ? "Child" : "Volunteer"} created successfully! UID: ${uid}`);
            router.push("/login");
        } catch (error) {
            Sentry.captureException(error);
            console.error("Error creating account:", error);
            alert("Error creating account: " + error.message);
        }
    };

    if (loading) {
        return <LoadingSpinner/>;
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4 relative">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md relative min-h-[80vh]">
                <div className="flex items-center justify-between mb-4">
                    <svg
                        onClick={() => window.history.back()}
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 cursor-pointer"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="black"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/>
                    </svg>
                    <h2 className="flex-grow text-center text-2xl font-bold text-gray-800">Create User</h2>
                </div>
                <div className="flex justify-center mb-6">
                    <Image src="/murphylogo.png" alt="Logo" width={150} height={150} priority/>
                </div>

                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="flex gap-4">
                        <div className="w-1/2">
                            <label htmlFor="first-name" className="text-sm font-medium text-gray-700 block mb-2">
                                First Name
                            </label>
                            <input
                                id="first-name"
                                type="text"
                                required
                                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                            />
                        </div>
                        <div className="w-1/2">
                            <label htmlFor="last-name" className="text-sm font-medium text-gray-700 block mb-2">
                                Last Name
                            </label>
                            <input
                                id="last-name"
                                type="text"
                                required
                                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="relative">
                        <label htmlFor="user-type" className="text-sm font-medium text-gray-700 block mb-2">
                            User Type
                        </label>
                        <select
                            id="user-type"
                            value={userType}
                            onChange={(e) => setUserType(e.target.value)}
                            className="appearance-none relative block w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            style={{paddingRight: "2.5rem"}}
                        >
                            <option value="local_volunteer">Local Volunteer</option>
                            <option value="child">Child</option>
                        </select>
                        <div
                            className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 mt-6">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg"
                                 viewBox="0 0 20 20">
                                <path
                                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/>
                            </svg>
                        </div>
                    </div>

                    {userType === "local_volunteer" && (
                        <div>
                            <label htmlFor="email" className="text-sm font-medium text-gray-700 block mb-2">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                required
                                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    )}

                    {userType === "child" && (
                        <div className="relative">
                            <label htmlFor="volunteer-id" className="text-sm font-medium text-gray-700 block mb-2">
                                Local Volunteer
                            </label>
                            <select
                                id="volunteer-id"
                                value={volunteerId}
                                onChange={(e) => setVolunteerId(e.target.value)}
                                required
                                className="appearance-none block w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                style={{paddingRight: "2.5rem"}}
                            >
                                <option value="">-- Select a Volunteer --</option>
                                {volunteers.length > 0 ? (
                                    volunteers.map((volunteer) => (
                                        <option key={volunteer.id} value={volunteer.id}>
                                            {volunteer.first_name} {volunteer.last_name} ({volunteer.id})
                                        </option>
                                    ))
                                ) : (
                                    <option value="" disabled>
                                        No volunteers available
                                    </option>
                                )}
                            </select>
                            <div
                                className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 mt-6">
                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg"
                                     viewBox="0 0 20 20">
                                    <path
                                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/>
                                </svg>
                            </div>
                        </div>
                    )}

                    {(userType === "child" || userType === "local_volunteer") && (
                        <>
                            <div>
                                <label htmlFor="password" className="text-sm font-medium text-gray-700 block mb-2">
                                    Password
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    required
                                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                            <div>
                                <label htmlFor="repeat-password"
                                       className="text-sm font-medium text-gray-700 block mb-2">
                                    Repeat Password
                                </label>
                                <input
                                    id="repeat-password"
                                    type="password"
                                    required
                                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    value={repeatPassword}
                                    onChange={(e) => setRepeatPassword(e.target.value)}
                                />
                            </div>
                        </>
                    )}

                    <button
                        type="submit"
                        style={{
                            padding: "10px 20px",
                            width: "80%",
                            margin: "50px auto",
                            display: "block",
                            backgroundColor: "#48801c",
                            color: "white",
                            border: "none",
                            borderRadius: "20px",
                            cursor: "pointer",
                        }}
                    >
                        Create User
                    </button>
                </form>
            </div>
        </div>
    );
}
