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
            setLoading(false);
        }
    };

    const handleInputChange = () => {
        setError('');
    };

    return (
        <PageContainer maxWidth="md" padding="p-8">
            <div className="relative">
                <BackButton href="/" />
                <div className="flex justify-center">
                    <Image src={logo} alt="Murphy Charitable Foundation Uganda" width={150} height={150} />
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Login
                </h2>
            </div>

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
                        borderColor="border-b border-gray-300"
                        focusBorderColor="focus:border-green-800"
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
                        borderColor="border-gray-300"
                        focusBorderColor="focus:border-green-800"
                        error={error && error.toLowerCase().includes('password') ? error : ''}
                    />
                </div>

                <div className="text-sm text-center">
                    <Link href="/reset-password" className="font-medium text-blue-600 hover:text-blue-500">
                        Forgot your password?
                    </Link>
                </div>

                <div className="flex justify-center space-x-4">
                    <Button
                        btnType="button"
                        btnText="Terms"
                        variant="blue"
                        size="small"
                        rounded="medium"
                        onClick={() => router.push('/terms-conditions')}
                    />
                    <Button
                        btnType="button" 
                        btnText="Privacy Policy"
                        variant="blue"
                        size="small"
                        rounded="medium"
                        onClick={() => router.push('/privacy-policy')}
                    />
                </div>

                <div className="flex items-center justify-center">
                    <input
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
                        btnText={
                            loading ? (
                                <div className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-gray-400"></div>
                            ) : (
                                'Log in'
                            )
                        }
                        color="gray"
                        hoverColor="hover:bg-[#48801c]"
                        textColor="text-white"
                        disabled={loading}
                        rounded="rounded-full"
                    />
                </div>
            </form>
        </PageContainer>
    );
}
