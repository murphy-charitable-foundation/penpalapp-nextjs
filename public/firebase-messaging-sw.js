importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

const productionFirebaseConfig = {
  apiKey: "AIzaSyBpYg-KAzwWGaT3g7J8smjnNqP8N8Nj8vQ",
  authDomain: "penpalmagicapp.firebaseapp.com",
  projectId: "penpalmagicapp",
  storageBucket: "penpalmagicapp.appspot.com",
  messagingSenderId: "45289060638",
  appId: "1:45289060638:web:33121bc47d40ceef83f10f",
  measurementId: "G-FG3MPZ8JV6",
};

const developmentFirebaseConfig = {
  apiKey: "AIzaSyDKph6qj7ojAf9pg6o0N8Lq1Zd7eUBC_YQ",
  authDomain: "penpalmagicapp-dev.firebaseapp.com",
  projectId: "penpalmagicapp-dev",
  storageBucket: "penpalmagicapp-dev.firebasestorage.app",
  messagingSenderId: "793782879682",
  appId: "1:793782879682:web:7e1ebb814edd688892025b",
  measurementId: "G-6TCJ7JEMZ0",
};

const firebaseConfig =
  process.env.NODE_ENV === "production"
    ? productionFirebaseConfig
    : developmentFirebaseConfig;

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();