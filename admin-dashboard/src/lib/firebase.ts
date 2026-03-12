import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// ⚠️ WARNING: DO NOT PUT SERVICE ACCOUNT KEYS HERE! ⚠️
// You pasted a Service Account Key (private_key) which is for the SERVER only.
// This is a CLIENT (React) app, so you must use the "Web App" configuration.
//
// 1. Go to Firebase Console -> Project Settings
// 2. Scroll down to "Your apps"
// 3. Select the Web App (</>)
// 4. Copy the "firebaseConfig" object (apiKey, authDomain, projectId, etc.)
// 5. Paste it below:

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
