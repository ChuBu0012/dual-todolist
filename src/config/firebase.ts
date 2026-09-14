import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore';

const getEnv = (key: string): string => {
  try {
    const meta = import.meta as any;
    if (typeof meta !== 'undefined' && meta?.env && meta.env[key]) {
      return meta.env[key];
    }
  } catch {
    // Ignore error in environments where import.meta is unavailable
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] as string;
  }
  return '';
};

const firebaseConfig = {
  apiKey: getEnv('VITE_FIREBASE_API_KEY') || getEnv('FIREBASE_API_KEY'),
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN') || getEnv('FIREBASE_AUTH_DOMAIN'),
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID') || getEnv('FIREBASE_PROJECT_ID'),
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET') || getEnv('FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID') || getEnv('FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnv('VITE_FIREBASE_APP_ID') || getEnv('FIREBASE_APP_ID'),
};

console.log('[DEBUG-7f3a] Firebase initializing with projectId:', firebaseConfig.projectId, {
  hasApiKey: !!firebaseConfig.apiKey,
  hasAuthDomain: !!firebaseConfig.authDomain,
  hasAppId: !!firebaseConfig.appId,
});

if (!firebaseConfig.projectId) {
  console.error('❌ CRITICAL ERROR: Firebase Project ID is missing! Make sure VITE_FIREBASE_PROJECT_ID is set in your environment or Vercel dashboard.');
}

// Initialize Firebase App instance
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const isBrowser = typeof window !== 'undefined';

console.log('[DEBUG-7f3a] Firestore initialized with experimentalForceLongPolling: true');
// Initialize Firestore (with offline cache in browser, standard in Node/serverless)
export const db: Firestore = isBrowser
  ? initializeFirestore(app, {
      experimentalForceLongPolling: true,
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    })
  : getFirestore(app);

console.log('[DEBUG-7f3a] Firestore initialized', { isBrowser });

export default db;
