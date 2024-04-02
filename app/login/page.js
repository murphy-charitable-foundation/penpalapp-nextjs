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
    const [showModal, setShowModal] = useState(false);
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
                    setError('The email is not correct.');
                    
                    break;
                case 'auth/wrong-password':
                    setError('The password is not correct.');
                    break;
                case 'auth/too-many-requests':
                    setError('Too many attempts. Your account was blocked.');
                    setShowModal(true);
                    break;
                default:
                    setError('Failed to log in.');
            }
        }
    }

        function closeModal() {
            setShowModal(false);
        }

    //};

    return (
        //<div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4">
            <div className="bg-white p-8 min-h-screen">
            <div style={{ textAlign: 'left', padding: '0px', background: 'white' }}>
                <div className="flex flex-row items-center justify-center ">
                <Link href="/">
                    <button style={{position:'absolute', left:30, border:'none', background:'none'}}>
                        <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                </Link>
                <h2 className="mt-6 text-center text-2xl font-bold text-gray-800">
                    Login
                </h2>
                </div>

                <div className="flex justify-center mb-6 mt-6">
                    <Image
                        src={logo}
                        alt="Murphy Charitable Foundation Uganda"
                        width={150} 
                        height={150} 
                    />
                </div>

                <form className="mt-14 space-y-12 " onSubmit={handleSubmit}>
                        <div>
                        <h6 className="mt-10 text-left ml-2 text-gray-800 ">Email</h6>
                        <input
                            type="email"
                            value={email}
                            autoComplete="email"
                            required
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Ex. user@gmail.com"
                            style={{ border: '0px', borderBottom: '1px solid black', padding: '10px', width: '100%', margin: '0 auto', display:'block', color: 'black' }}
                            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                        />
                        </div>
                        
                        <div>
                        <h6 className="mt-12 text-left ml-2 text-gray-800 ">Password</h6>
                        <input
                            type="password"
                            value={password}
                            autoComplete="current-password"
                            required
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="******"
                            style={{ border: '0px', borderBottom: '1px solid black', padding: '10px', width: '100%', margin: '0 auto', display: 'block', color: 'black' }}
                            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm" 
                        />
                        </div>
                        
                        {error && <span className="flex items-left text-sm text-red-500">{error}</span>}
                        
                    <div className="text-sm">
                            <a href="/reset-password" style={{textDecoration:'underline'}} className="font-medium text-gray-600 hover:text-blue-500">
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

                    <div >
                        <button 
                           type="submit" 
                           style={{
                           padding:'10px 20px',
                           width:'80%', 
                           margin:'50px auto', 
                           display:'block',
                           borderRadius:'20px',
                           cursor:'pointer',
                           marginTop:"120px",
                           }} 
                           className="group relative  w-full flex justify-center py-2 px-4 border border-transparent rounded-full text-sm font-medium  text-gray-400 bg-gray-200 hover:bg-[#48801c] hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-transparent">
                            Log in
                        </button>
                        
                    </div>
                </form>

        {showModal && (
        <div style={{
          position: 'absolute',
          paddingTop:'80px',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow:'auto',
          zIndex: '2',
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '5px',
            textAlign: 'left',
            width: '80%',
            boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.2)'
          }}>
            <h3 style={{ color: 'red'}}>Your account was blocked</h3>
            <p style={{ color: 'black', marginTop:'20px',leading:'[2rem]'}}>Please send an email to verify the reason.</p>
            <div className="flex justify-center">
            <button onClick={closeModal} style={{backgroundColor: '#48801c', color: 'white', padding: '10px 20px', margin: '30px 0', borderRadius: '20px', border: 'none', cursor: 'pointer' }}>
              Understood
            </button>
            </div>
          </div>
        </div>
      )}

     </div>
    </div>
        //</div>
    );
}
