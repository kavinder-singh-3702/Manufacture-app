/**
 * Firebase Configuration
 *
 * This file connects your app to Firebase for real-time chat.
 *
 * SETUP COMPLETE!
 * Your Firebase project: manufacture-app-chat
 *
 * NEXT STEP:
 * Make sure you've enabled Firestore Database in Firebase Console:
 * 1. Go to Build > Firestore Database
 * 2. Click "Create database"
 * 3. Choose "Start in test mode"
 * 4. Select location (asia-south1 for India)
 * 5. Click Enable
 */

import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDW5fb-X5tS23bM8igmw-4-cPbsV_Z9_kY",
  authDomain: "manufacture-app-chat.firebaseapp.com",
  projectId: "manufacture-app-chat",
  storageBucket: "manufacture-app-chat.firebasestorage.app",
  messagingSenderId: "87487534424",
  appId: "1:87487534424:web:58fb19506b107988d9412d",
  measurementId: "G-B8F6EBG5T3"
};

// Initialize Firebase (only once)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore
export const db = getFirestore(app);

export default app;
