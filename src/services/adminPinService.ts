import { doc, getDoc, getFirestore, serverTimestamp, setDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { auth } from './firebase';
import { AdminPinVerifier, createAdminPinVerifier, verifyAdminPin } from '../utils/adminPinCrypto';

const db = getFirestore(auth.app);
const assertStoreOwner = (user: User, storeId: string) => {
  if (!user.uid || auth.currentUser?.uid !== user.uid || !user.emailVerified || storeId !== user.uid) {
    throw new Error('Une session Google vérifiée du propriétaire de cette boutique est nécessaire.');
  }
};

const verifierRef = (storeId: string) => doc(db, 'stores', storeId, 'adminSecurity', 'pin');

export const saveStoreAdminPin = async (user: User, storeId: string, pin: string): Promise<void> => {
  assertStoreOwner(user, storeId);
  const verifier = await createAdminPinVerifier(pin);
  await setDoc(verifierRef(storeId), {
    ...verifier,
    updatedAt: serverTimestamp(),
    updatedBy: user.uid
  });
};

export const verifyStoreAdminPin = async (user: User, storeId: string, pin: string): Promise<boolean> => {
  assertStoreOwner(user, storeId);
  const snapshot = await getDoc(verifierRef(storeId));
  if (!snapshot.exists()) return false;
  const data = snapshot.data();
  const verifier: AdminPinVerifier = {
    algorithm: data.algorithm,
    iterations: data.iterations,
    salt: data.salt,
    hash: data.hash
  };
  return verifyAdminPin(pin, verifier);
};

export const hasStoreAdminPin = async (user: User, storeId: string): Promise<boolean> => {
  assertStoreOwner(user, storeId);
  const snapshot = await getDoc(verifierRef(storeId));
  return snapshot.exists();
};
