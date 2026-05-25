import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCJDCabz2mVghxj5Noa_XWATZ6Dgn5V3kg",
  authDomain: "partidosfecha.firebaseapp.com",
  projectId: "partidosfecha",
  storageBucket: "partidosfecha.firebasestorage.app",
  messagingSenderId: "344573129001",
  appId: "1:344573129001:web:0fdfa93c01a9bf683bc738",
  measurementId: "G-ZPZBBTNP72"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
