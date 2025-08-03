
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, Auth } from "firebase/auth";

const firebaseConfig = {
  "projectId": "udhaarx-58swr",
  "appId": "1:592464655572:web:17584bccdd5c67b6363741",
  "storageBucket": "udhaarx-58swr.appspot.com",
  "apiKey": "AIzaSyDOjDU8TeLu5X8QtcQY4Uq4CFZGq4rxtqs",
  "authDomain": "udhaarx-58swr.firebaseapp.com",
  "messagingSenderId": "592464655572"
};

let app: FirebaseApp;
let auth: Auth;
let googleProvider: GoogleAuthProvider;

if (typeof window !== 'undefined') {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
}

// @ts-ignore
export { app, auth, googleProvider };
