import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  User
} from 'firebase/auth';
import { auth } from './firebase';

/**
 * Owner sign-in uses Firebase Google authentication only.
 * Unlike the Drive backup flow, this provider requests no Google Drive scope.
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
