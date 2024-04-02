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

export default function ChangePassword() {
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
        e.preventDefault();

        //if(password !== repeatPassword){
          //return;
        //}
        //setError('');
        try{
          const user = auth.currentUser;
          const uid = user.uid;
          updatePassword(user, password)
          
          setShowModal(true); 
          //router.push('/login'); 
             
        }catch(error) {
          console.error(error);
        }           
        //Redirect to profile page or any other page as needed
        //router.push('/login'); 
  }
 
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
        <button
            type="submit"
            style={{
            padding: '10px 20px',
            width: '80%',
            margin: '50px auto',
            display: 'block',
            //backgroundColor: '#48801c',
            //color: 'white',
            border: 'none',
            borderRadius: '20px',
            marginTop:'50px',
            cursor: 'pointer'
            }}
            className="group relative  w-full flex justify-center py-2 px-4 border border-transparent rounded-full text-sm font-medium  text-gray-400 bg-gray-200  hover:text-white hover:bg-[#48801c] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"

        >
            Done
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
            <h3 style={{ color: 'blue'}}>The reset was succesfully!</h3>
            <p style={{ color: 'black', marginTop:'20px',leading:'[2rem]'}}>Your password has been reset. Please sign in to your account again.</p>
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
