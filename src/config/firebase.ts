import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDkGHomwWBkiXf4iHUTPbOkPnzyhHal1OA",
  authDomain: "travelsync-prod.firebaseapp.com",
  projectId: "travelsync-prod",
  storageBucket: "travelsync-prod.firebasestorage.app",
  messagingSenderId: "681292175026",
  appId: "1:681292175026:web:ba1ff1b0f9562decb85bab",
  measurementId: "G-BW1CDVSCS9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// App ID for Firestore document paths
const appId = 'travelsync-prod';

export { app, analytics, auth, db, appId };

// Re-export Firebase Auth utilities
export {
  signInAnonymously,
  onAuthStateChanged,
  signInWithCustomToken
} from 'firebase/auth';

// Re-export Firestore utilities
export {
  collection,
  doc,
  addDoc,
  updateDoc,
  onSnapshot,
  deleteDoc,
  writeBatch,
  getDocs
} from 'firebase/firestore';
