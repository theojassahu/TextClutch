import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  Auth,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp,
  increment,
  Firestore,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDummyKeyForInitialDev",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "textclutch.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "textclutch",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "textclutch.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "946888627198",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:946888627198:web:2a0740deeb0fd706a366af",
};

// Singleton Firebase initialization
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

auth = getAuth(app);
db = getFirestore(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

/**
 * Sync user profile and generation statistics to Firestore users/{uid}
 * Non-blocking with timeout so it never hangs authentication
 */
export async function syncUserProfile(user: User, isGeneration = false): Promise<void> {
  if (!user || !user.uid) return;

  try {
    const userRef = doc(db, "users", user.uid);
    const payload: Record<string, any> = {
      uid: user.uid,
      email: user.email || "",
      displayName: user.displayName || user.email?.split("@")[0] || "Clutch User",
      photoURL: user.photoURL || "",
      lastActive: serverTimestamp(),
    };

    if (isGeneration) {
      payload.generationCount = increment(1);
    }

    // Wrap in 3s timeout so offline/uncreated Firestore never hangs the app
    const syncPromise = setDoc(userRef, payload, { merge: true });
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Firestore sync timed out")), 3000)
    );

    await Promise.race([syncPromise, timeoutPromise]);
  } catch (error) {
    console.warn("Firestore syncUserProfile notice (non-fatal):", error);
  }
}

/**
 * Sign in with Google Popup (Immediate return, non-blocking sync)
 */
export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  // Run profile sync in background so login returns immediately
  syncUserProfile(result.user).catch(() => {});
  return result.user;
}

/**
 * Sign in with Email and Password (Immediate return, non-blocking sync)
 */
export async function signInWithEmail(email: string, pass: string): Promise<User> {
  const result = await signInWithEmailAndPassword(auth, email, pass);
  syncUserProfile(result.user).catch(() => {});
  return result.user;
}

/**
 * Sign up with Email and Password (Immediate return, non-blocking sync)
 */
export async function signUpWithEmail(email: string, pass: string): Promise<User> {
  const result = await createUserWithEmailAndPassword(auth, email, pass);
  syncUserProfile(result.user).catch(() => {});
  return result.user;
}

/**
 * Sign out current user
 */
export async function logOut(): Promise<void> {
  await firebaseSignOut(auth);
}

export { app, auth, db, googleProvider, onAuthStateChanged };
export type { User };
