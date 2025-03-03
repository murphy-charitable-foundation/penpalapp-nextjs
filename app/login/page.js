"use client";

// pages/login.js
import {useState, useEffect} from "react";
import {
    signInWithEmailAndPassword,
    browserLocalPersistence,
    browserSessionPersistence,
    setPersistence,
} from "firebase/auth";
import {db, auth} from "../firebaseConfig";
import {doc, getDoc, setDoc} from "firebase/firestore";
import Link from "next/link";
import Image from "next/image";
import logo from "/public/murphylogo.png";
import {useRouter} from "next/navigation";
import Button from "@/components/general/Button";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [showModal, setShowModal] = useState(false);
    const router = useRouter();
    const [rememberMe, setRememberMe] = useState(false);
    const isFormFilled = email && password;

    useEffect(() => {
        // Check if the user is already logged in and retrieve the email
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                router.push("/letterhome");
            } else {
                router.push("/login");
            }
        });

        return () => unsubscribe(); // Clean up the listener on component unmount
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        try {
            // Set persistence based on "Remember Me" checkbox
            const persistenceType = rememberMe
                ? browserLocalPersistence
                : browserSessionPersistence;

            await setPersistence(auth, persistenceType);
            await signInWithEmailAndPassword(auth, email, password);

            const uid = auth.currentUser.uid;
            const userRef = doc(db, "users", uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                router.push("/letterhome");
            } else {
                router.push("/create-acc");
            }
        } catch (error) {
            console.error("Authentication error:", error.message);
            switch (error.code) {
                case "auth/user-not-found":
                    setError("The email is not correct.");
                    break;
                case "auth/wrong-password":
                    setError("The password is not correct.");
                    break;
                case "auth/too-many-requests":
                    setError("Too many attempts. Your account was blocked.");
                    setShowModal(true);
                    break;
                default:
                    setError("Failed to log in.");
            }
        }
    };

    function closeModal() {
        setShowModal(false);
    }

    return (
        <div className="flex flex-col items-center min-h-screen bg-white px-6">
            <div className="w-full max-w-md flex flex-col justify-between min-h-screen py-6">
                <div>
                    <div className="relative">
                        <button
                            className="absolute left-0 top-1/2 -translate-y-1/2 bg-transparent border-none"
                            onClick={() => window.history.back()}
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
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex justify-center">
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

            {showModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-10 overflow-auto pt-20">
                    <div className="bg-white p-5 rounded-md w-4/5 max-w-md shadow-lg">
                        <h3 className="text-red-500 font-bold">Your account was blocked</h3>
                        <p className="text-black mt-5 leading-8">
                            Please send an email to verify the reason.
                        </p>
                        <div className="flex justify-center mt-8">
                            <button
                                className="bg-[#48801c] text-white py-2 px-5 rounded-full border-none cursor-pointer"
                                onClick={closeModal}
                            >
                                Understood
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
