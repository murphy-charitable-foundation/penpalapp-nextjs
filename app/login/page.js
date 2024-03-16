"use client"

// pages/login.js
import { useState } from 'react';
import { signInWithEmailAndPassword } from "firebase/auth";
import { db, auth } from '../firebaseConfig'; 
import { doc, getDoc, setDoc } from "firebase/firestore"; 
import Link from 'next/link';
import Image from 'next/image';
import logo from '/public/murphylogo.png';
import { useRouter } from 'next/navigation';


export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); 
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
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-6">
            <div className="w-full max-w-md space-y-8">
            <div style={{ textAlign: 'left', padding: '20px', background: 'white' }}>
                <Link href="/">
                    <button>
                        <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                </Link>
                <div className="flex justify-center">
                    <Image
                        src={logo}
                        alt="Murphy Charitable Foundation Uganda"
                        width={150} 
                        height={150} 
                    />
                </div>

                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Login
                </h2>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div>
                        <input
                            type="email"
                            value={email}
                            autoComplete="email"
                            required
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Ex. user@gmail.com"
                            style={{ border: '0px', borderBottom: '1px solid black', padding: '10px', width: '100%', margin: '0 auto', display: 'block', color: 'black' }}
                        />
                        </div>
                        <div>
                        <input
                            type="password"
                            value={password}
                            autoComplete="current-password"
                            required
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="******"
                            style={{ border: '0px', borderBottom: '1px solid black', padding: '10px', width: '100%', margin: '0 auto', display: 'block', color: 'black' }}
                        />
                    </div>

                    <div className="text-sm">
                            <a href="/reset-password" className="font-medium text-blue-600 hover:text-blue-500">
                                Forgot your password?
                            </a>
                        </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                                Remember me
                            </label>
                        </div>
                    </div>

                    <div>
                        <button type="submit" className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gray-500 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            Log in
                        </button>
                    </div>
                </form>
                <Link href="/create-acc">
                    <button className=" group w-full flex justify-center px-6 py-3 text-sm mt-8 font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-blue">
                        Create Account
                    </button>
                </Link>
            </div>
            </div>
        </div>
    );
}