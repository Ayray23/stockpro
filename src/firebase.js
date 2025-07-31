// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// ✅ Your Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyDbhgKiGx0HT044Dcq49-FSHMul97zhRM4",
  authDomain: "stock-pro-af1f7.firebaseapp.com",
  projectId: "stock-pro-af1f7",
  storageBucket: "stock-pro-af1f7.appspot.com", // 🔧 (you had `.firebasestorage.app`, corrected to `.appspot.com`)
  messagingSenderId: "468171572830",
  appId: "1:468171572830:web:513fd10cfa89e129bb16cf",
  measurementId: "G-NRHLD4X635",
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ Export services for use
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);
