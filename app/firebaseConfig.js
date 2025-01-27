
// Import the functions you need from the SDKs you need
import { getStorage } from "@firebase/storage";
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, FieldPath, getDoc } from "firebase/firestore";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// import { getAnalytics } from "firebase/analytics";
// todo Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBpYg-KAzwWGaT3g7J8smjnNqP8N8Nj8vQ",
  authDomain: "penpalmagicapp.firebaseapp.com",
  projectId: "penpalmagicapp",
  storageBucket: "penpalmagicapp.appspot.com",
  messagingSenderId: "45289060638",
  appId: "1:45289060638:web:33121bc47d40ceef83f10f",
  measurementId: "G-FG3MPZ8JV6"
};

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app, "gs://penpalmagicapp.appspot.com/");

let messaging;
if (typeof window !== "undefined") {
  // Initialize Messaging in the browser only
  messaging = getMessaging(app);
}

export { db, auth, storage, messaging, FieldPath };

// Initialize Firebase Authentication and export


import { doc, setDoc } from "firebase/firestore";

export const requestForToken = async () => {
  try {
    const token = await getToken(messaging, {
      vapidKey: 'BL0rVqsgVKnkhFuzly4i471txifurrzYLpa2681lkzisSwfxbTf75lQ4vZTAffy_NExQBhFWr8jDupiuUT5BOsc',
    });
    if (token) {
      const user = auth.currentUser;

      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          const userGroup = userData.userGroup;

          if (userGroup) {
            const tokenDocRef = doc(db, "fcmTokens", token);
            await setDoc(tokenDocRef, {
              userGroup: userGroup,
              fcmToken: token,
              createdAt: new Date(),
            });

            console.log('FCM token and userGroup stored in Firestore successfully.');
          } else {
            console.log('No userGroup found for the user.');
          }
        } else {
          console.log('User document does not exist.');
        }
      } else {
        console.log('No authenticated user found. Cannot store the token.');
      }
    } else {
      console.log('No registration token available. Request permission to generate one.');
    }
  } catch (err) {
    console.log('An error occurred while retrieving or storing token: ', err);
  }
};

export const requestNotificationPermission = async () => {
  if ('Notification' in window) {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('Notification permission granted.');
        // Handle the case when permission is granted
      } else if (permission === 'denied') {
        console.log('Notification permission denied.');
      } else {
        console.log('Notification permission dismissed.');
      }
    } catch (error) {
      console.error('Failed to request notification permission:', error);
    }
  } else {
    console.error('Notifications are not supported by this browser.');
  }
};

