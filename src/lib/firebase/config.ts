
import { initializeApp, getApps, getApp, type FirebaseOptions, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

// This check ensures Firebase is initialized only on the client-side.
// It also handles HMR by checking getApps().length.
if (typeof window !== 'undefined') {
  const requiredKeys: (keyof FirebaseOptions)[] = ['apiKey', 'authDomain', 'projectId'];
  const missingKeys = requiredKeys.filter(key => !firebaseConfig[key]);

  if (missingKeys.length > 0) {
    console.error(`Firebase config is missing required keys: ${missingKeys.join(', ')}. Check your .env file and ensure variables are prefixed with NEXT_PUBLIC_.`);
  } else {
    if (!getApps().length) {
      try {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
      } catch (error) {
        console.error("Failed to initialize Firebase app:", error);
        // app, auth, db will remain undefined
      }
    } else {
      app = getApp(); // Get existing app
      // Ensure auth and db are also initialized if app already exists
      if (app) {
        auth = getAuth(app);
        db = getFirestore(app);
      }
    }
  }
}

export { app, auth, db };
