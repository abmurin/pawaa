import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// These should be replaced by the user from their Firebase Console
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSy_placeholder_API_KEY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "pawaa_app.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "pawaa_app",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "pawaa_app.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abcdefghij"
};

// Initialize Firebase (main app for logged-in users)
const app = initializeApp(firebaseConfig);
// Initialize second app for user creation (doesn't affect current auth state)
const appForUserCreation = initializeApp(firebaseConfig, 'userCreation');

// Initialize Firebase services
export const auth = getAuth(app);
export const authForUserCreation = getAuth(appForUserCreation);
export const db = getFirestore(app);

// Authentication Helpers
const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

export const loginWithEmail = async (email: string, pass: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, pass);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Email", error);
    throw error;
  }
};

export const registerWithEmail = async (email: string, pass: string) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    return result.user;
  } catch (error) {
    console.error("Error registering with Email", error);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
    throw error;
  }
};

export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error("Error resetting password", error);
    throw error;
  }
};

// Create user with password without affecting current logged-in user
export const createUserWithPassword = async (email: string, password: string) => {
  try {
    const result = await createUserWithEmailAndPassword(authForUserCreation, email, password);
    // Sign out the newly created user from the second auth instance
    await signOut(authForUserCreation);
    return result.user;
  } catch (error) {
    console.error("Error creating user with password", error);
    throw error;
  }
};
