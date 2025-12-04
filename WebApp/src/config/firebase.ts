import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Firebase configuration (same as mobile app)
const firebaseConfig = {
  apiKey: "AIzaSyB-wfz-2qgTCE0moQL-lVWNpWVKVYwiMHc",
  authDomain: "findazzure.firebaseapp.com",
  projectId: "findazzure",
  storageBucket: "findazzure.firebasestorage.app",
  messagingSenderId: "804114580108",
  appId: "1:804114580108:web:0e471566a61b785a6331a9",
  measurementId: "G-YKXTBZ6L6M"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

export default app;
