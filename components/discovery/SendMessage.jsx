"use client"

import {useState, useEffect} from 'react'
import { db, auth } from "../firebaseConfig";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { updateDoc } from "firebase/firestore";
import { doc, getDoc, setDoc } from "firebase/firestore";
//This is the send message button in the kid card. It also creates the connection between the user and the kid
export default function SendMessage({kidId}) {
  useEffect(() => {
    
  },[]);

  return (
    <div>

    </div>
  )
}

