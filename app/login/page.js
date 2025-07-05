"use client";

import { useState } from 'react';
import { signInWithEmailAndPassword } from "firebase/auth";
import { db, auth } from '../firebaseConfig';
import { doc, getDoc } from "firebase/firestore";
import Link from 'next/link';
import Image from 'next/image';
import logo from '/public/murphylogo.png';
import { useRouter } from 'next/navigation';
import Button from "../../components/general/Button";
import Input from "../../components/general/Input";
import { BackButton } from '../../components/general/BackButton';
import { PageContainer } from "../../components/general/PageContainer";
import { PageHeader } from '../../components/general/PageHeader';
import LoadingSpinner from '../../components/loading/LoadingSpinner';

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
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const uid = userCredential.user.uid;
            const userRef = doc(db, "users", uid);
            const userSnap = await getDoc(userRef);
            
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
        
        }
    };

    const handleInputChange = () => {
        setError('');
    };

    return (
        <PageContainer maxWidth="md" padding="p-8">
            { loading && <LoadingSpinner /> }
            <PageHeader title="Login"/>
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                <div>
                    <Input
                        type="email"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            handleInputChange();
                        }}
                        placeholder="Ex. user@gmail.com"
                        id="email"
                        name="email"
                        required
                        label="Email"
                        error={error && error.toLowerCase().includes('email') ? error : ''}
                    />
                </div>

                <div>
                    <Input
                        type="password"
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value);
                            handleInputChange();
                        }}
                        placeholder="******"
                        id="password"
                        name="password"
                        required
                        label="Password"
                        error={error && error.toLowerCase().includes('password') ? error : ''}
                    />
                </div>

                <div className="text-sm text-center">
                    <Link href="/reset-password" className="font-medium text-blue-600 hover:text-blue-500">
                        Forgot your password?
                    </Link>
                </div>

                <div className="flex justify-center space-x-4">
                    
                    
                </div>

                <div className="flex items-center justify-center">
                    <Input
                        id="remember-me"
                        name="remember-me"
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                        Remember me
                    </label>
                </div>

                {error && !error.toLowerCase().includes('email') && !error.toLowerCase().includes('password') && (
                    <div className="text-red-500 text-sm text-center">{error}</div>
                )}

                <div className="flex justify-center">
                    <Button
                        btnType="submit"
                        btnText='Log in'
                        color="green"
                        textColor="text-white"
                        disabled={loading}
                    />
                </div>
            </form>
        </PageContainer>
    );
}
