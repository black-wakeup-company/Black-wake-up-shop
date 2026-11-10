import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User
} from 'firebase/auth';
import { auth } from './googleAuth';

/**
 * Owner authentication is deliberately separate from the Google Drive
 * backup flow. It requests Firebase Google sign-in only and does not ask
 * for Drive scopes.
 */
const ownerProvider = new GoogleAuthProvider();
ownerProvider.setCustomParameters({ prompt: 'select_account' });

export const signInOwnerWithGoogle = async (): Promise<User> => {
  const result = await signInWithPopup(auth, ownerProvider);
  return result.user;
};

export const subscribeToOwnerAuth = (
  callback: (user: User | null) => void
) => onAuthStateChanged(auth, callback);

/**
 * Signs out the Firebase owner session. Google Drive's cached token is
 * managed separately by googleAuth.ts; callers should disconnect Drive
 * explicitly when they want to revoke the local backup connection too.
 */
export const signOutOwner = async (): Promise<void> => {
  await signOut(auth);
};
