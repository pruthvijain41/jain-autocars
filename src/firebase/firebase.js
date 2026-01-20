// Import the functions you need from the Firebase SDKs
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// If you are using Analytics, keep this import
import { getAnalytics } from "firebase/analytics";


// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDN7_6Y2U5mRMEURzjXMXtavKMJ4ifyaNc",
  authDomain: "jain-autocars.firebaseapp.com",
  projectId: "jain-autocars",
  storageBucket: "jain-autocars.firebasestorage.app",
  messagingSenderId: "1086909123772",
  appId: "1:1086909123772:web:3d7c6910b1c414097a54b9",
  measurementId: "G-PVY0GZ0JY6" // Keep if you want to use Analytics
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const analytics = getAnalytics(app);

// Export the initialized services
export {
  app,
  auth,
  db,
  storage,
  analytics
};