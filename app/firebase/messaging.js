import { collection, addDoc } from "firebase/firestore";
import { messaging, db } from "../firebaseConfig";
import { getToken, onMessage } from "firebase/messaging";
import { getAuth } from "firebase/auth";

const VAPID_KEY =
  "BL0rVqsgVKnkhFuzly4i471txifurrzYLpa2681lkzisSwfxbTf75lQ4vZTAffy_NExQBhFWr8jDupiuUT5BOsc";

// Requests permissions to show notifications.
async function requestNotificationsPermissions() {
  console.log("Requesting notifications permission...");
  const permission = await Notification.requestPermission();

  if (permission === "granted") {
    console.log("Notification permission granted.");
    // Notification permission granted.
    await saveMessagingDeviceToken();
  } else {
    console.log("Unable to get permission to notify.");
  }
}

// Saves the messaging device token to Cloud Firestore.
export async function saveMessagingDeviceToken() {
  console.log("save msg device token");
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (typeof user === "undefined") {
      //TODO: redirect user to login page?
      console.error("Sender not identified, please log in.");
    }
    const uid = user.uid;
    const msg = await messaging();
    const fcmToken = await getToken(msg, { vapidKey: VAPID_KEY });
    if (fcmToken) {
      console.log("Got FCM device token:", fcmToken);
      // Save device token to
      // for now, hardcoded. can use a userID or something else you can query
      await addDoc(collection(db, "tokens"), {
        user_id: uid,
        token: fcmToken,
      });
      // This will fire when a message is received while the app is in the foreground.
      // When the app is in the background, firebase-messaging-sw.js will receive the message instead.
      onMessage(msg, (message) => {
        console.log(
          "New foreground notification from Firebase Messaging!",
          message.notification
        );
        new Notification(message.notification.title, {
          body: message.notification.body,
        });
      });
    } else {
      // Need to request permissions to show notifications.
      requestNotificationsPermissions();
    }
  } catch (error) {
    console.error("Unable to get messaging token.", error);
  }
}
