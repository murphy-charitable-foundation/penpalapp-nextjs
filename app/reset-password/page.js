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
      <div style={{ display: 'inline-block', width: '80%', maxWidth: '500px', textAlign: 'left', marginTop:"80px"}}>
      <label htmlFor="email" style={{padding:"10px"}} className="text-sm font-medium text-gray-700 block">Write your e-mail registered</label>
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
        borderColor="border-gray-300"
        focusBorderColor="focus:border-blue-500"
        placeholderColor="placeholder:text-gray-500"
        rounded="rounded-none"
        size="w-4/5 mx-auto"
        padding="px-3 py-2"
        label="Write your e-mail registered"
        labelColor="text-gray-700"
      />
      <Button
        btnType="button"
        btnText="Reset"
        color="bg-gray-200"
        textColor="text-gray-400"
        hoverColor="hover:bg-[#48801c]"
        hoverTextClr="hover:text-white"
        font="font-medium"
        rounded="rounded-full"
        size="w-full"
        onClick={resetPassword}
      />
        Reset
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
            <h3 style={{ color: 'blue'}}>Check your email</h3>
            <p style={{ color: 'black', marginTop:'20px',leading:'[2rem]'}}>Please check your email inbox and spam folder for a verification email to reset your password.</p>
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
  </div>
  );
}