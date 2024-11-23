"use server";
import admin from "firebase-admin";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import * as firebaseAdmin from "firebase-admin";
import serviceAccount from "../../service_key.json";

if (!firebaseAdmin.apps.length) {
  firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert({
      privateKey: serviceAccount.private_key,
      clientEmail: serviceAccount.client_email,
      projectId: serviceAccount.project_id,
    }),
  });
}

async function retrieveUserToken(uid) {
  var registrationToken = "";
  console.log(uid)
  const q = query(collection(db, "tokens"), where("user_id", "==", uid));

  const querySnapshot = await getDocs(q);
  console.log(q);
  var doc = querySnapshot.docs[0].data()["token"];
  registrationToken = doc;
  console.log("registration token", registrationToken);

  const message = {
    token: registrationToken,
    notification: {
      title: "Here is a Notification!",
      body: "my message is here.",
    },
    data: {
      title: "Here is a notification!",
      body: "my message is here.",
      // link_url: "http://localhost:3000" // When a user clicks on the notification, go here
    },
  };

  return message;
}

export async function FCM_PUSH(uid) {
  retrieveUserToken(uid)
    .then((message) => {
      admin
        .messaging()
        .send(message)
        .then((response) => {
          console.log(response);
        });
    })
    .catch((error) => {
      console.log("error sending message:", error);
    });
}
