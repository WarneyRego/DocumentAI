import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDiYRf-6Pcd4rtpgWXixpLZUAfhOJf5aFo",
  authDomain: "microsaas-4084e.firebaseapp.com",
  projectId: "microsaas-4084e",
  storageBucket: "microsaas-4084e.firebasestorage.app",
  messagingSenderId: "1087915412806",
  appId: "1:1087915412806:web:c4e18d13c7d90d6c1ea947"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);