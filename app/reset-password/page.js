"use client"

{/* pages/reset-password.js */}
import { db, auth } from '../firebaseConfig'; 
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import logo from '/public/murphylogo.png'; 
import Image from 'next/image';
import { sendPasswordResetEmail } from 'firebase/auth';
import Button from '../../components/general/Button';
import Input from '../../components/general/Input'; 
import Modal from '../../components/general/Modal';
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
    router.push('/login');
  }

  const modalContent = (
    <div>
      <p style={{ color: 'black', marginTop:'20px', fontSize: '0.9rem'}}>Please check your email inbox and spam folder for a verification email to reset your password.</p>
      <div className="flex justify-center mt-4">
        <Button onClick={closeModal} btnText="Understood" 
          color="green"/>
      </div>
    </div>

  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-6">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-md">
    <div style={{ textAlign: 'center', padding: '0px', background: 'white' }}>
        <div className="flex flex-row items-center justify-between mb-4">
                    <svg
                        onClick={() => window.history.back()}
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 cursor-pointer"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="black"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                    <h2 className="flex-grow text-center text-2xl font-bold text-gray-800">Reset your password</h2>
                    <div className="h-6 w-6"></div>
                </div>
      <div className="flex justify-center">
        <Image src={logo} alt="Foundation Logo" width={200} margin={0}/>
      </div>
      <Input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Ex: user@gmail.com"
        name="email"
        id="email"
        required
        bgColor="bg-white"
        textColor="text-black"
        label="Write your registered email"
        labelColor="text-gray-700"
      />
      <div className="mt-4">
        <Button
          btnType="button"
          btnText="Reset"
          color="gray"
          textColor="text-gray-400"
          size="default"
          onClick={resetPassword}
        />
      </div>
      
    </div>
    </div>
    <Modal isOpen={showModal} width="large" onClose={() => {setShowModal(false);}} title="Please Check Your Email" content={modalContent} />
  </div>
  );
}