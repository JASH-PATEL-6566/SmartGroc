import { initializeApp } from "firebase/app";
import { getReactNativePersistence, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAuT_Bmsws7u7WWTmHcUuWd6bfzYNRykAc",
  authDomain: "smartgroc-e0717.firebaseapp.com",
  projectId: "smartgroc-e0717",
  storageBucket: "smartgroc-e0717.firebasestorage.app",
  messagingSenderId: "607748027664",
  appId: "1:607748027664:web:d4c85ae73c83191618a195",
};

const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
