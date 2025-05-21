// // Import the functions you need from the SDKs you need
import { getStorage } from "@firebase/storage";
import { initializeApp } from "@firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, FieldPath } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBpYg-KAzwWGaT3g7J8smjnNqP8N8Nj8vQ",
  authDomain: "penpalmagicapp.firebaseapp.com",
  projectId: "penpalmagicapp",
  storageBucket: "penpalmagicapp.appspot.com",
  messagingSenderId: "45289060638",
  appId: "1:45289060638:web:33121bc47d40ceef83f10f",
  measurementId: "G-FG3MPZ8JV6",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { db, auth, storage, FieldPath };
