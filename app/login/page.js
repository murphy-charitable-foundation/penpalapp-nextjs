"use client";

import { useState } from 'react';
import { signInWithEmailAndPassword } from "firebase/auth";
import { db, auth } from '../firebaseConfig';
import { doc, getDoc } from "firebase/firestore";
import Link from 'next/link';
import Image from 'next/image';
import logo from '/public/murphylogo.png';
import { useRouter } from 'next/navigation';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            const uid = auth.currentUser.uid;
            const userRef = doc(db, "users", uid);
            const userSnap = await getDoc(userRef)
            if (userSnap.exists()) {
                router.push('/letterhome');
            } else {
                router.push('/create-acc');
            }
        } catch (error) {
            console.error("Authentication error:", error.message);
            switch (error.code) {
                case 'auth/user-not-found':
                    setError('No user found with this email.');
                    break;
                case 'auth/wrong-password':
                    setError('Wrong password.');
                    break;
                case 'auth/too-many-requests':
                    setError('Too many attempts. Try again later.');
                    break;
                default:
                    setError('Failed to log in.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = () => {
        setError('');
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-6">
            <div className="w-full max-w-md space-y-8 bg-white rounded-lg shadow-md p-8">
                <div className="relative">
                    <button 
                        className="absolute left-0 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 rounded-full"
                        onClick={() => router.push("/")}
                    >
                        <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div className="flex justify-center">
                        <Image src={logo} alt="Murphy Charitable Foundation Uganda" width={150} height={150} />
                    </div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Login
                    </h2>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                            type="email"
                            value={email}
                            autoComplete="email"
                            required
                            onChange={(e) => {
                                setEmail(e.target.value);
                                handleInputChange();
                            }}
                            placeholder="Ex. user@gmail.com"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                        <input
                            type="password"
                            value={password}
                            autoComplete="current-password"
                            required
                            onChange={(e) => {
                                setPassword(e.target.value);
                                handleInputChange();
                            }}
                            placeholder="******"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                        />
                    </div>

                    <div className="text-sm">
                        <a href="/reset-password" className="font-medium text-blue-600 hover:text-blue-500">
                            Forgot your password?
                        </a>
                    </div>

                    {error && <div className="text-red-500 text-sm">{error}</div>}

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: "80%",
                                display: "block",
                                borderRadius: "20px", 
                                cursor: "pointer",
                                margin: "0 auto"
                            }}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent rounded-full text-sm font-medium text-gray-200 bg-green-800 hover:bg-[#48801c] hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-transparent disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-gray-400"></div>
                            ) : (
                                'Log in'
                            )}
                        </button>
                    </div>
                </form>

                <Link href="/create-acc">
                    <button className="w-full mt-4 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        Create Account
                    </button>
                </Link>
            </div>
        </div>
    );
}
