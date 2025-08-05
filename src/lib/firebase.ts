
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, Auth } from "firebase/auth";
import { getFirestore, Firestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";

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
  
  try {
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
    });
  } catch(e) {
      console.error(e);
      // This can happen if more than one tab is open.
      // We will just use the default firestore instance.
      db = getFirestore(app);
  }
}

// @ts-ignore
export { app, auth, googleProvider, db };
