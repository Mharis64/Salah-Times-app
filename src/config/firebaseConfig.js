/**
 * firebaseConfig.js
 * ─────────────────────────────────────────────────────────────────────────────
 * HOW TO SET UP FIREBASE (5 minutes):
 *
 * 1. Go to https://console.firebase.google.com
 * 2. Click "Add project" → name it "salah-times" → Continue
 * 3. Project Settings (⚙️) → "Your apps" → Add app → Android
 *    • Package name: com.salahapp.islamictimes
 *    • Download google-services.json → replace the file in project root
 * 4. Enable Firestore:
 *    Build → Firestore Database → Create database → Start in test mode
 * 5. Enable Auth:
 *    Build → Authentication → Sign-in method → Email/Password → Enable
 * 6. Copy your project config below (Project Settings → General → SDK setup)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import {
  initializeAuth,
  getAuth,
  getReactNativePersistence,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Replace these with your real Firebase project values ─────────────────────
const firebaseConfig = {
  apiKey:            'YOUR_API_KEY',
  authDomain:        'YOUR_PROJECT_ID.firebaseapp.com',
  projectId:         'YOUR_PROJECT_ID',
  storageBucket:     'YOUR_PROJECT_ID.appspot.com',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId:             'YOUR_APP_ID',
};
// ─────────────────────────────────────────────────────────────────────────────

/** True only when real credentials have been added. */
export const FIREBASE_CONFIGURED =
  firebaseConfig.apiKey !== 'YOUR_API_KEY' &&
  firebaseConfig.projectId !== 'YOUR_PROJECT_ID';

let app = null;
let db  = null;
let auth = null;

if (FIREBASE_CONFIGURED) {
  try {
    app  = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db   = getFirestore(app);
    auth = getApps().length === 1
      ? initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) })
      : getAuth(app);
  } catch (e) {
    console.warn('[Firebase] Init failed:', e.message);
  }
}

export { app, db, auth };
