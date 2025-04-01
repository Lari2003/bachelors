import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your Firebase config (use the one you provided)
const firebaseConfig = {
  apiKey: "AIzaSyAA7Q7fx6TyEZCN-0xUEGWzgTZ9g7DJr0A",
  authDomain: "movierecommender-4cd88.firebaseapp.com",
  projectId: "movierecommender-4cd88",
  storageBucket: "movierecommender-4cd88.appspot.com", // Fixed the bucket name
  messagingSenderId: "150294693628",
  appId: "1:150294693628:web:be5f5f1df2c6d26ad37979"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);