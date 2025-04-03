// Import the necessary functions from the SDKs you need
import { getStorage } from "@firebase/storage";
import { initializeApp } from "@firebase/app";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  FieldPath,
  getDoc,
  doc,
  setDoc,
  updateDoc,
  query,
  orderBy,
  collection,
  getDocs,
} from "firebase/firestore";
import { getMessaging, getToken } from "firebase/messaging";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBpYg-KAzwWGaT3g7J8smjnNqP8N8Nj8vQ",
  authDomain: "penpalmagicapp.firebaseapp.com",
  projectId: "penpalmagicapp",
  storageBucket: "penpalmagicapp.appspot.com",
  messagingSenderId: "45289060638",
  appId: "1:45289060638:web:33121bc47d40ceef83f10f",
  measurementId: "G-FG3MPZ8JV6",
};

const VAPID_KEY =
  "BL0rVqsgVKnkhFuzly4i471txifurrzYLpa2681lkzisSwfxbTf75lQ4vZTAffy_NExQBhFWr8jDupiuUT5BOsc";

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

/**
 * Helper function to assign a new user group.
 * It queries the fcmTokens collection for the current highest group number,
 * then sets the new group as highest + 1.
 * Updates both the fcmTokens document and the user's document with the new group.
 */
const assignNewUserGroup = async (token, userDocRef) => {
  const tokenDocRef = doc(db, "fcmTokens", token);
  const fcmTokensQuery = query(
    collection(db, "fcmTokens"),
    orderBy("userGroup", "desc")
  );
  const fcmTokensSnapshot = await getDocs(fcmTokensQuery);
  const highestUserGroup =
    fcmTokensSnapshot.docs.length > 0
      ? fcmTokensSnapshot.docs[0].data().userGroup
      : 0;
  const newUserGroup = highestUserGroup + 1;
  await setDoc(tokenDocRef, {
    userGroup: newUserGroup,
    fcmToken: token,
    createdAt: new Date(),
  });
  await updateDoc(userDocRef, { userGroup: newUserGroup });
  return newUserGroup;
};

/**
 * Retrieves the registration token from Firebase Messaging.
 *
 * @param {boolean} forceNewGroup — if set to true, any existing userGroup is overridden by creating a new one.
 *                                   This branch is used when permissions have just been granted.
 */
export const requestForToken = async (forceNewGroup = false) => {
  try {
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    console.log(token)
    if (!token) {
      console.log(
        "No registration token available. Request permission to generate one."
      );
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      console.log("No authenticated user found. Cannot store the token.");
      return;
    }

    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);
    let userGroup;

    if (forceNewGroup) {
      // When permissions have just been granted, always create a new user group.
      userGroup = await assignNewUserGroup(token, userDocRef);
      console.log(`New user group ${userGroup} assigned after permission grant.`);
    } else {
      // Permissions already granted; try to retrieve the existing userGroup.
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        userGroup = userData.userGroup;
      } else {
        console.log("User document does not exist.");
        return;
      }
      // Assign a user group if the user is new (i.e. no group assigned yet)
      if (!userGroup) {
        userGroup = await assignNewUserGroup(token, userDocRef);
        console.log(`User did not have a group. New user group ${userGroup} assigned.`);
      } else {
        console.log(`Existing user group ${userGroup} found. Using the current group.`);
      }
    }
    console.log("FCM token and userGroup stored in Firestore successfully.");
  } catch (err) {
    console.log("An error occurred while retrieving or storing token: ", err);
  }
};

/**
 * Requests Notification Permission from the browser.
 * Returns the permission value.
 */
export const requestNotificationPermission = async () => {
  if ("Notification" in window) {
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        console.log("Notification permission granted.");
      } else if (permission === "denied") {
        console.log("Notification permission denied.");
      } else {
        console.log("Notification permission dismissed.");
      }
      return permission;
    } catch (error) {
      console.error("Failed to request notification permission:", error);
      return null;
    }
  } else {
    console.error("Notifications are not supported by this browser.");
    return null;
  }
};

/**
 * Handles the overall notification setup.
 * If the browser already has Notification permissions granted,
 * it retrieves the token and uses the existing user group (or assigns one if missing).
 * Otherwise, it requests permission and, if granted, forces a new user group assignment.
 */
export const handleNotificationSetup = async () => {
  if ("Notification" in window) {
    if (Notification.permission === "granted") {
      console.log("Notification permission already granted. Retrieving token...");
      await requestForToken(false); // Use existing userGroup if available.
    } else {
      const permission = await requestNotificationPermission();
      if (permission === "granted") {
        console.log("Notification permission granted through prompt. Creating new user group...");
        await requestForToken(true); // Force new user group assignment.
      } else {
        console.log("Notification permission was not granted.");
      }
    }
  } else {
    console.error("Notifications are not supported by this browser.");
  }
};