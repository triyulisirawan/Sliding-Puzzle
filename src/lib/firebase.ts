import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  User as FirebaseUser,
} from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || getStoredGuestId(),
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous ?? true,
      tenantId: auth.currentUser?.tenantId,
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
}

// Generate or retrieve persistent local guest ID if anonymous auth is disabled
export function getStoredGuestId(): string {
  if (typeof window === 'undefined') return 'guest_default';
  let guestId = localStorage.getItem('angka_geser_guest_uid');
  if (!guestId) {
    guestId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem('angka_geser_guest_uid', guestId);
  }
  return guestId;
}

// Ensure user authentication with seamless fallback to persistent guest UID
export async function ensureAuth(): Promise<{ uid: string; displayName?: string; isGuest: boolean }> {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        unsubscribe();
        resolve({
          uid: user.uid,
          displayName: user.displayName || 'Pemain Cilik',
          isGuest: user.isAnonymous,
        });
      } else {
        try {
          const cred = await signInAnonymously(auth);
          unsubscribe();
          resolve({
            uid: cred.user.uid,
            displayName: 'Pemain Cilik',
            isGuest: true,
          });
        } catch (err) {
          // If anonymous sign-in is restricted on Firebase Console, fall back gracefully to persistent local guest ID
          unsubscribe();
          const fallbackUid = getStoredGuestId();
          resolve({
            uid: fallbackUid,
            displayName: 'Pemain Cilik',
            isGuest: true,
          });
        }
      }
    });
  });
}

// Google Sign In helper
export async function signInWithGoogle() {
  try {
    const res = await signInWithPopup(auth, googleProvider);
    return res.user;
  } catch (err) {
    console.error('Google Sign-In Error:', err);
    throw err;
  }
}

// Connection test
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

testConnection();
