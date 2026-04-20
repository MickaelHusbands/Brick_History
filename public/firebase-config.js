import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCI2xLHJY7oogIkZ6AvNoIRA528AOFGL-0",
  authDomain: "lego-302ea.firebaseapp.com",
  projectId: "lego-302ea",
  storageBucket: "lego-302ea.firebasestorage.app",
  messagingSenderId: "422343434730",
  appId: "1:422343434730:web:f63a8e5e6aa664a4205293"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);