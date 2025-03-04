import { addDoc, collection, doc, setDoc } from "firebase/firestore";
import { auth } from "../config/firebaseConfig";
import {
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { db } from "@/config/firebaseConfig";

// login user with email and password
export const loginWithEmailPassword = async (
  email: string,
  password: string
) => {
  try {
    const userCredentials = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    return userCredentials.user;
  } catch (error) {
    console.error("Error signing in:", error);
  }
};

// logout user
export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
  }
};

// create user with email and password
export const signUpWithEmailPassword = async (
  username: string,
  email: string,
  password: string
) => {
  try {
    const userCredentials = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    if (userCredentials.user) {
      const { uid } = userCredentials.user;
      await updateProfile(userCredentials.user, { displayName: username });

      // Store user data in Firestore using uid as the document ID
      const userRef = doc(db, "users", uid);
      await setDoc(userRef, {
        uid,
        username,
        email,
        createdAt: new Date(),
      });

      return userCredentials.user;
    }
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};
