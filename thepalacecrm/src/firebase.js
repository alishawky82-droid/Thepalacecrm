import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAuFjxI_ypSTdACwqfdslIwnGu7hQOvy-k",
  authDomain: "thepalacecrm.firebaseapp.com",
  projectId: "thepalacecrm",
  storageBucket: "thepalacecrm.firebasestorage.app",
  messagingSenderId: "512566151017",
  appId: "1:512566151017:web:83c9d9244bd7d87a2fdff8",
  measurementId: "G-Q9MR94GZRY"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);