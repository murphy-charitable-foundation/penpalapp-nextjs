"use client";

import {useEffect, useState} from "react";
import {browserSessionPersistence, setPersistence, signInWithEmailAndPassword, signOut} from "firebase/auth";
import {auth, db} from "../firebaseConfig";
import Image from "next/image";
import logo from "/public/murphylogo.png";
import {useRouter} from "next/navigation";
import Button from "@/components/general/Button";
import LoadingSpinner from "@/components/loadingSpinner/LoadingSpinner";
import {doc, getDoc} from "firebase/firestore";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const isFormFilled = email && password;

    // Function to check user_type and redirect
    const redirectBasedOnUserType = async (uid) => {
        try {
            const userRef = doc(db, "users", uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists() && userSnap.data().user_type === "local_volunteer") {
                router.push("/children-gallery");
            } else {
                await signOut(auth);
                setError("Please log in as a Local Volunteer.");
                setIsLoading(false);
            }
        } catch (err) {
            console.error("Error fetching user data:", err.message);
            setError("Failed to redirect. Please try again.");
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                await redirectBasedOnUserType(user.uid);
            } else {
                setIsLoading(false);
            }
        });
        return () => unsubscribe();
    }, [router]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        try {
            await setPersistence(auth, browserSessionPersistence);
            await signInWithEmailAndPassword(auth, email, password);
            await redirectBasedOnUserType(auth.currentUser.uid);
        } catch (error) {
            console.error("Authentication error:", error.message);
            const message = errorMessages[error.code] || errorMessages.default;
            setError(message);
            if (error.code === "auth/too-many-requests") {
                setShowModal(true);
            }
        }
    };

    const closeModal = () => setShowModal(false);

    if (isLoading) {
        return <LoadingSpinner/>;
    }

    return (
        <div className="flex flex-col items-center min-h-screen bg-white px-6 mt-6">
            <div className="w-full max-w-md flex flex-col justify-between min-h-screen py-6">
                <div>
                    <div className="relative">
                        <button
                            className="absolute left-0 top-1/2 -translate-y-1/2 bg-transparent border-none"
                            onClick={() => router.push("/")}
                        >
                            <svg
                                className="h-6 w-6 text-gray-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M15 19l-7-7 7-7"
                                />
                            </svg>
                        </button>
                        <span className="block text-center text-2xl font-bold text-gray-800">
              Login
            </span>
                    </div>
                    <div className="flex justify-center mt-4">
                        <Image
                            src={logo}
                            alt="Murphy Charitable Foundation Uganda"
                            width={150}
                            height={150}
                        />
                    </div>
                </div>

                <form
                    className="flex flex-col gap-6 items-center justify-center flex-grow relative"
                    onSubmit={handleSubmit}
                >
                    <div className="w-full">
                        <h6 className="text-left ml-2 text-gray-800">Email</h6>
                        <input
                            type="email"
                            value={email}
                            autoComplete="email"
                            required
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Ex. user@gmail.com"
                            className="w-full border-0 border-b border-black py-2 px-3 text-black focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    <div className="w-full">
                        <h6 className="text-left ml-2 text-gray-800">Password</h6>
                        <input
                            type="password"
                            value={password}
                            autoComplete="current-password"
                            required
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="******"
                            className="w-full border-0 border-b border-black py-2 px-3 text-black focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    {error && (
                        <span className="text-sm text-red-500 text-left w-full">{error}</span>
                    )}

                    <div className="text-left text-sm w-full">
                        <a
                            href="/reset-password"
                            className="font-medium text-gray-600 underline hover:text-blue-500"
                        >
                            Forgot your password?
                        </a>
                    </div>
                    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex justify-center">
                        <Button
                            btnText="Log in"
                            btnType="submit"
                            color={isFormFilled ? "bg-[#4E802A]" : "bg-gray-200"}
                            textColor={isFormFilled ? "text-white" : "text-gray-400"}
                            font="font-medium"
                            disabled={!isFormFilled}
                        />
                    </div>
                </form>
            </div>
        </div>
    );
}
