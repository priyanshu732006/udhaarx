// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  projectId: "udhaarx-58swr",
  appId: "1:592464655572:web:17584bccdd5c67b6363741",
  storageBucket: "udhaarx-58swr.appspot.com",
  apiKey: "AIzaSyDOjDU8TeLu5X8QtcQY4Uq4CFZGq4rxtqs",
  authDomain: "udhaarx-58swr.web.app",
  messagingSenderId: "592464655572",
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, googleProvider };
