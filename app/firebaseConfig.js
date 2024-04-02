
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBUTKI4Xht7efTJHMVA6D0r_ZVvV8Xqb3E",
  authDomain: "realpenpalapp.firebaseapp.com",
  projectId: "realpenpalapp",
  storageBucket: "realpenpalapp.appspot.com",
  messagingSenderId: "853361535232",
  appId: "1:853361535232:web:432c09876d2c5be8492be5",
  measurementId: "G-0YX4P9TEZZ"
};

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const analytics = getAnalytics(app);

export { db, auth, analytics };

// Initialize Firebase Authentication and export