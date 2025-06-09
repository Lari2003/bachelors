import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAA7Q7fx6TyEZCN-0xUEGWzgTZ9g7DJr0A",
  authDomain: "movierecommender-4cd88.firebaseapp.com",
  projectId: "movierecommender-4cd88",
  storageBucket: "movierecommender-4cd88.appspot.com",
  messagingSenderId: "150294693628",
  appId: "1:150294693628:web:be5f5f1df2c6d26ad37979"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.log("Offline persistence can only be enabled in one tab at a time.");
  } else if (err.code === 'unimplemented') {
    console.log("The current browser does not support offline persistence.");
  }
});

// Export the services you'll use
export { auth, db, storage, ref, uploadBytes, getDownloadURL };
