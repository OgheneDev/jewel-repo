import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCd689LoT_YevkibEuUmoozMibgEF9GBf8",
  authDomain: "jewel-30104.firebaseapp.com",
  projectId: "jewel-30104",
  storageBucket: "jewel-30104.firebasestorage.app",
  messagingSenderId: "186035928274",
  appId: "1:186035928274:web:135c08770a38df94e1010b",
  measurementId: "G-J1YWLTX5GR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

export { db };