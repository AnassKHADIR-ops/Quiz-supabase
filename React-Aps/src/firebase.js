import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBSZ66lYV_tIisoPcuYI8A4zoQhjwjqBgo",
  authDomain: "testdemaths-3bcba.firebaseapp.com",
  projectId: "testdemaths-3bcba",
  storageBucket: "testdemaths-3bcba.firebasestorage.app",
  messagingSenderId: "706290492469",
  appId: "1:706290492469:web:aecde42ed7d438e10a3d7c",
  measurementId: "G-N6C93TZ29R",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

// The teacher account — replace with your own email if different.
export const TEACHER_EMAIL = "anass.khadir@usmba.ac.ma";

export default app;
