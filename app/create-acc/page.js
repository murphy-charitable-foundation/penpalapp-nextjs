"use client"

// pages/create-acc.js
import { useState } from 'react';
import { useRouter } from 'next/navigation'; 
import { updatePassword, signOut } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from '../firebaseConfig'; 
import { handleLogout } from '../profile/page'; 
import Link from 'next/link';
import Image from 'next/image';
import PasswordChecklist from "react-password-checklist";



export default function CreateAccount() {
    const [first_name, setFirstName] = useState('');
    const [last_name, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [date_of_birth, setBirthday] = useState('');
    const [newPassword, setPassword] = useState('');
    const [repeatPassword, setRepeatPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter(); 
    const user = auth.currentUser;
    //const email= user.email;

    const handleSubmit = async (e) => {
        e.preventDefault();

        //if (password !== repeatPassword) {
            //alert("Passwords do not match.");
            //return;
        //}
        try {           
            const uid = user.uid;
            try {
                await updatePassword(user, newPassword);
            }
            catch (error) {
                if (error.code == 'auth/requires-recent-login') {
                    console.error("Account creation timed out: ", error.message);
                    alert("Account creation timed out. Please try logging in again.");
                    await signOut(auth);
                    router.push('/login');
                    return
                }
                else {
                    console.error("Failed to change password: ", error.message);
                    throw error;
                }
            }


            // Create a document in Firestore in "users" collection with UID as the document key
            await setDoc(doc(db, "users", uid), {
                created_at: new Date(),
                first_name,
                last_name,
                email:user.email,
                date_of_birth, 
            });

            // Redirect to profile page or any other page as needed
            router.push('/profile'); 
        } catch (error) {
            console.error("Error creating account:", error);
            alert(error.message);
        }
    }


    return (
        //<div className="flex flex-col items-center justify-center min-h-screen bg-white px-8"> 
            <div className="bg-white p-8 min-h-screen">          
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
                    <h2 className="flex-grow text-center text-2xl font-bold text-gray-800">Create account</h2>
                </div>
                <div className="flex justify-center mb-6">
                    <Image src="/murphylogo.png" alt="Your Logo" width={150} height={150} />
                </div>
                <form className="space-y-1.5" onSubmit={handleSubmit}>
                    <div className="flex gap-4">
                        <div className="w-1/2">
                            <label htmlFor="first-name" className="text-sm font-medium text-gray-700 block mb-2">First name</label>
                            <input id="first-name" type="text" placeholder="Ex: Jane" style={{ border: '0px', borderBottom: '1px solid black', padding: '10px', width: '100%', margin: '0 auto', display:'block', color: 'black' }} required className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm" value={first_name} onChange={(e) => setFirstName(e.target.value)} />
                        </div>
                        <div className="w-1/2">
                            <label htmlFor="last-name" className="text-sm font-medium text-gray-700 block mb-2">Last name</label>
                            <input id="last-name" type="text" placeholder="Ex: Doe" style={{ border: '0px', borderBottom: '1px solid black', padding: '10px', width: '100%', margin: '0 auto', display:'block', color: 'black' }} required className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm" value={last_name} onChange={(e) => setLastName(e.target.value)} />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="email" className="text-sm font-medium text-gray-700 block mb-2">Email</label>
                        <input id="email"  style={{ border: '0px', borderBottom: '1px solid black', padding: '10px', width: '100%', margin: '0 auto', display:'block', color: 'black' }} required className="appearance-none rounded-none relative block w-full px-3 py-2 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" value={user.email}/>
                    </div>
                    <div>
                        <label htmlFor="birthday" className="text-sm font-medium text-gray-700 block mb-2">Birthday</label>
                        <input id="birthday" type="date" style={{ border: '0px', borderBottom: '1px solid black', padding: '10px', width: '100%', margin: '0 auto', display:'block', color: 'black' }} className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" value={date_of_birth} onChange={(e) => setBirthday(e.target.value)} />
                    </div>
                    <div>
                        <label htmlFor="newPassword" className="text-sm font-medium text-gray-700 block mb-2"> Create a password</label>
                        <input id="newPassword" name="newPassword" type="password" placeholder="*******" autoComplete="new-password" style={{ border: '0px', borderBottom: '1px solid black', padding: '10px', width: '100%', margin: '0 auto', display:'block', color: 'black' }} required className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900  focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm" value={newPassword} onChange={(e) => setPassword(e.target.value)} />
                    </div>
                    <div>
                        <label htmlFor="repeatPassword" className="text-sm font-medium text-gray-700 block mb-2">Repeat Password</label>
                        <input id="repeatPassword" name="repeatPassword" type="password" placeholder="*******" style={{ border: '0px', borderBottom: '1px solid black', padding: '10px', width: '100%', margin: '0 auto', display:'block', color: 'black' }} required className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm" value={repeatPassword} onChange={(e) => setRepeatPassword(e.target.value)} />
                    </div>
                    <div className="text-left text-sm text-red-600">
                      <PasswordChecklist
                        rules={["minLength", "specialChar", "number", "capital","lowercase","match"]}
                        minLength={7}
                        value={newPassword}
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
                    {error && <span className="flex items-left text-sm text-red-500">{error}</span>}

                    <div className="text-sm">
                        <p className="font-medium text-gray-600">See the  <a href="/terms-conditions" style={{textDecoration:'underline'}} className="font-medium text-gray-600 hover:text-blue-500">
                                terms and conditions</a> and <a href="/privacy-policy" style={{textDecoration:'underline'}} className="font-medium text-gray-600 hover:text-blue-500">
                                privacy policy.</a>                            
                        </p>
                    </div>

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
                        cursor: 'pointer'
                        }}
                        className="group relative  w-full flex justify-center py-2 px-4 border border-transparent rounded-full text-sm font-medium  text-gray-400 bg-gray-200 hover:bg-[#48801c] hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"

                    >
                        Accept and Continue
                    </button>
                </form>
            </div>   
        //</div>

    );
}
