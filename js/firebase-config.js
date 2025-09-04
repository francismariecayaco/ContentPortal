// /js/firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyCoNNaQ30xVM3tjC1vBiUp6y8Hkl8sy2V8",
  authDomain: "maynilatekdo.firebaseapp.com",
  databaseURL: "https://maynilatekdo-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "maynilatekdo",
  storageBucket: "maynilatekdo.appspot.com",
  messagingSenderId: "835673306092",
  appId: "1:835673306092:web:f0541edb14edc7741b46c9",
  measurementId: "G-B1S4DB0T5G"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
