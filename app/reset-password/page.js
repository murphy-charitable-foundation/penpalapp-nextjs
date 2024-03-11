"use client"

import { db, auth } from '../firebaseConfig'; 
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import logo from '/public/murphylogo.png';
import Image from 'next/image';
import { sendPasswordResetEmail } from 'firebase/auth';

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  function resetPassword() {
    sendPasswordResetEmail(auth, email)
      .then(() => {
        setShowModal(true);
      })
      .catch((error) => {
        console.error(error);
      });
  }

  function closeModal() {
    setShowModal(false);
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-6">
        <div className="w-full max-w-md space-y-8">
    <div style={{ textAlign: 'center', padding: '20px', background: 'white' }}>
        <div className="flex items-center justify-between mb-4">
                    <svg
                        onClick={() => window.history.back()}
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 cursor-pointer"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                    <h2 className="flex-grow text-center text-2xl font-bold text-gray-800">Reset your password</h2>
                    <div className="h-6 w-6"></div>
                </div>
      <div className="flex justify-center">
        <Image src={logo} alt="Foundation Logo" width={200} margin={0}/>
      </div>
      <div style={{ display: 'inline-block', width: '80%', maxWidth: '500px', textAlign: 'left' }}>
      <label htmlFor="email" className="text-sm font-medium text-gray-700 block">Write your e-mail registered</label>
      </div>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Ex: user@gmail.com"
        style={{ border: '0px', borderBottom: '1px solid black', padding: '10px', width: '80%', margin: '0 auto', display: 'block' }}
      />
      <button
        onClick={resetPassword}
        style={{
          padding: '10px 20px',
          width: '80%',
          margin: '50px auto',
          display: 'block',
          backgroundColor: '#48801c',
          color: 'white',
          border: 'none',
          borderRadius: '20px',
          cursor: 'pointer'
        }}
      >
        Reset
      </button>

      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2,
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '5px',
            textAlign: 'center',
            boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.2)'
          }}>
            <h3 style={{ color: '#023268' }}>Check your email</h3>
            <p>Please check your email inbox and spam folder for a verification email to reset your password.</p>
            <button onClick={closeModal} style={{ backgroundColor: 'lightgray', color: 'black', padding: '10px 20px', margin: '10px 0', borderRadius: '20px', border: 'none', cursor: 'pointer' }}>
              Cancel
            </button>
            <button onClick={closeModal} style={{ backgroundColor: '#48801c', color: 'white', padding: '10px 20px', margin: '10px 0', borderRadius: '20px', border: 'none', cursor: 'pointer' }}>
              Understood
            </button>
          </div>
        </div>
      )}
    </div>
    </div>
    </div>
  );
}
