import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC_bAeFm0vmeZOifQ-rzBx8FyYJbpo0qP8",
  authDomain: "study-dashboard-f06b6.firebaseapp.com",
  projectId: "study-dashboard-f06b6",
  storageBucket: "study-dashboard-f06b6.firebasestorage.app",
  messagingSenderId: "1022782851397",
  appId: "1:1022782851397:web:81395757ca7669c5a9962c"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app); // Now properly defined