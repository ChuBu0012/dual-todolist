import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore';

const getEnv = (viteKey: string, nodeKey: string): string => {
  if (typeof process !== 'undefined' && process.env && process.env[nodeKey]) {
    return process.env[nodeKey] as string;
  }
  return '';
};

// Note: Vite requires explicit import.meta.env.VITE_XXX references for static replacement in production builds.
const firebaseConfig = {
  apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY || getEnv('VITE_FIREBASE_API_KEY', 'FIREBASE_API_KEY'),
  authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || getEnv('VITE_FIREBASE_AUTH_DOMAIN', 'FIREBASE_AUTH_DOMAIN'),
  projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || getEnv('VITE_FIREBASE_PROJECT_ID', 'FIREBASE_PROJECT_ID'),
  storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || getEnv('VITE_FIREBASE_STORAGE_BUCKET', 'FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', 'FIREBASE_MESSAGING_SENDER_ID'),
  appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID || getEnv('VITE_FIREBASE_APP_ID', 'FIREBASE_APP_ID'),
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
