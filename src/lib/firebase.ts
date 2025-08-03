
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, Auth } from "firebase/auth";
import { getFirestore, Firestore, enableIndexedDbPersistence } from "firebase/firestore";

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
let db: Firestore;

if (typeof window !== 'undefined') {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
  db = getFirestore(app);
  enableIndexedDbPersistence(db)
    .catch((err) => {
      if (err.code == 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled
        // in one tab at a a time.
        console.warn('Firestore persistence failed: multiple tabs open.');
      } else if (err.code == 'unimplemented') {
        // The current browser does not support all of the
        // features required to enable persistence
        console.warn('Firestore persistence not available in this browser.');
      }
    });
}

// @ts-ignore
export { app, auth, googleProvider, db };
