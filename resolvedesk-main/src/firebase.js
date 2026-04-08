// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, query, where, getDocs, orderBy, onSnapshot, doc, getDoc, updateDoc, arrayUnion, addDoc, serverTimestamp, setDoc, deleteDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC9J46B3Nv1j8Lt8DMeC30PtqEfts5SpdA",
  authDomain: "resolvedesk-af26e.firebaseapp.com",
  projectId: "resolvedesk-af26e",
  storageBucket: "resolvedesk-af26e.firebasestorage.app",
  messagingSenderId: "126073086461",
  appId: "1:126073086461:web:4ce45607885f61c95a7994"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Export everything
export { 
  auth, 
  db, 
  storage,
  // Firestore functions
  collection,
  query,
  where,
  getDocs,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  addDoc,
  serverTimestamp,
  setDoc,
  deleteDoc,
  // Storage functions
  ref,
  uploadBytes,
  getDownloadURL
};

export default app;