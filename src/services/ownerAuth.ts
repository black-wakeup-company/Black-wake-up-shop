import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User
} from 'firebase/auth';
import { auth } from './firebase';

/**
 * Owner sign-in uses Firebase Google authentication only.
 * It requests no Google Drive scope; Drive backup authorization stays separate.
 */
const ownerProvider = new GoogleAuthProvider();
ownerProvider.setCustomParameters({ prompt: 'select_account' });

export const signInOwnerWithGoogle = async (): Promise<User> => {
  const result = await signInWithPopup(auth, ownerProvider);
  return result.user;
};

export const subscribeToOwnerAuth = (callback: (user: User | null) => void) =>
  onAuthStateChanged(auth, callback);

export const signOutOwner = async (): Promise<void> => {
  await signOut(auth);
};
