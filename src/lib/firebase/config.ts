import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const isConfigValid = !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

if (!isConfigValid && typeof window !== 'undefined') {
  console.error(
    '🚨 Firebase Configuration Error: NEXT_PUBLIC_FIREBASE_API_KEY is undefined!\n' +
    'Did you restart your Next.js development server after creating the `.env.local` file?'
  );
}

// Initialize Firebase App
const app = getApps().length === 0 
  ? initializeApp(isConfigValid ? firebaseConfig : { apiKey: "fake-key-for-build-safety", projectId: "fake-id" }) 
  : getApp();

// Initialize and export Firebase Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize Firebase Analytics safely (SSR-friendly)
export let analytics: Analytics | null = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export default app;
