"use client"

// pages/change-password.js
import { db, auth } from '../firebaseConfig'; 
import React,{ useState } from 'react';
import { useRouter } from 'next/navigation';
import logo from '/public/murphylogo.png';
import Image from 'next/image';
//import { sendPasswordResetEmail } from 'firebase/auth';
import { updatePassword, signOut } from "firebase/auth";
//import { handleLogout } from '../profile/page'; 
import PasswordChecklist from "react-password-checklist";
import Modal from "../../components/general/Modal";
import Button from '../../components/general/Button';

export default function ChangePassword() {
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
        e.preventDefault();

        try {
          const user = auth.currentUser;
          const uid = user.uid;
          await updatePassword(user, password);
          setShowModal(true);
             
        } catch (error) {
          if (error.code === 'auth/requires-recent-login') {
            setError('For security, please sign in again before changing your password');
            router.push('/login');
          } else if (error.code === 'auth/weak-password') {
            setError('Please choose a stronger password');
          } else if (error.code === 'auth/user-disabled') {
            setError('This account has been disabled. Please contact support.');
          } else {
            Sentry.captureException(error);
            setError('An unexpected error occurred. Please try again later.');
          }
          console.error(error);
        }
  }

  const modalContent = (<div className="space-y-4">
            <p style={{ color: 'black', text: 'textCenter', marginTop:'20px'}}>Your password has been reset. Please sign in to your account again.</p>
            <div className="flex justify-center">
            <Button onClick={closeModal} 
              color="green"
              btnText="Understood"
            />
            </div>
          </div>);
 
  function closeModal() {
    setShowModal(false);
    router.push('/login');
  }


  return (
    //<div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-6">
    <div className="bg-white p-8 min-h-screen">
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
                    <h2 className="flex-grow text-center text-2xl font-bold text-gray-800">Create a new password</h2>
                    <div className="h-6 w-6"></div>
                </div>
      <div className="flex justify-center">
        <Image src={logo} alt="Foundation Logo" width={200} margin={0}/>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
      
            <div style={{textAlign:'left',marginTop:'80px'}}>
                <label htmlFor="password" style={{padding:'10px'}} className="text-sm font-medium text-gray-700 block mb-2"> New password</label>
                <input id="password" name="password" type="password" placeholder="*******" autoComplete="new-password" style={{ border: '0px', borderBottom: '1px solid black', padding: '10px', width: '100%', margin: '0 auto', display:'block', color: 'black' }} required className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900  focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm" value={password} onChange={(e) => setPassword(e.target.value)} />

            </div>
            <div style={{textAlign:'left',marginTop:'50px'}}>
                <label htmlFor="repeat-password" style={{padding:'10px'}} className="text-sm font-medium text-gray-700 block mb-2">Verified a new Password</label>
                <input id="repeat-password" name="repeatPassword" type="password" placeholder="*******" style={{ border: '0px', borderBottom: '1px solid black', padding: '10px', width: '100%', margin: '0 auto', display:'block', color: 'black' }} required className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm" value={repeatPassword} onChange={(e) => setRepeatPassword(e.target.value)} />
                
            </div>

            <div className="text-left text-sm text-red-600">
              <PasswordChecklist
                    rules={["minLength", "specialChar", "number", "capital","lowercase","match"]}
                    minLength={7}
                    value={password}
                    valueAgain={repeatPassword}
                    messages={{
                       minLength:"Must be at least 7 characters.",
                       specialChar:"Must contain at least 1 special character.",
                       number:"Must contain at least 1 number.",
                       capital:"Must contain at least 1 uppercase letter.",
                       lowercase:"Must conatain at least 1 lowercase letter.",
                       match:"Passwords do not match.",
                    }}
               />
             </div>

        <div>
        <Button
            btnType="submit"
            btnText="Done"
            color="gray"
            textColor="gray"
            size="large"
        />
        </div>
    </form>

      
    </div>
    <Modal isOpen={showModal} onClose={() => {setShowModal(false);}} title="Password reset was successful!" content={modalContent} width="large"/>
  </div>
    //</div>
  );
}