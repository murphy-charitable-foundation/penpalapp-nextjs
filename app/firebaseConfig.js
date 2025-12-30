// app/firebaseConfig.js

// 1. 全部改成 "firebase/xxx" (去掉前面的 @)
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBpYg-KAzwWGaT3g7J8smjnNqP8N8Nj8vQ",
  authDomain: "penpalmagicapp.firebaseapp.com",
  projectId: "penpalmagicapp",
  storageBucket: "penpalmagicapp.appspot.com",
  messagingSenderId: "45289060638",
  appId: "1:45289060638:web:33121bc47d40ceef83f10f",
  measurementId: "G-FG3MPZ8JV6",
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

const db = getFirestore(app);
const auth = getAuth(app);

const storage = getStorage(app);

// 导出
export { db, auth, storage, app };
