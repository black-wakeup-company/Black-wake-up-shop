import { doc, getDoc, getFirestore, serverTimestamp, setDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { auth } from './firebase';
import { AdminPinVerifier, createAdminPinVerifier, verifyAdminPin } from '../utils/adminPinCrypto';
import { getScopedStorageKey } from '../utils/tenantStorage';

const db = getFirestore(auth.app);
const assertStoreOwner = (user: User, storeId: string) => {
  if (!user.uid || auth.currentUser?.uid !== user.uid || !user.emailVerified || storeId !== user.uid) {
    throw new Error('Une session Google vérifiée du propriétaire de cette boutique est nécessaire.');
  }
};

const verifierRef = (storeId: string) => doc(db, 'stores', storeId, 'adminSecurity', 'pin');
const cacheKey = (storeId: string) => getScopedStorageKey('ADMIN_PIN_VERIFIER', storeId);

const readCachedVerifier = (storeId: string): AdminPinVerifier | null => {
  try {
    const raw = localStorage.getItem(cacheKey(storeId));
    return raw ? JSON.parse(raw) as AdminPinVerifier : null;
  } catch {
    return null;
  }
};

const cacheVerifier = (storeId: string, verifier: AdminPinVerifier): void => {
  try {
    localStorage.setItem(cacheKey(storeId), JSON.stringify(verifier));
  } catch (error) {
    console.warn('Impossible de mettre en cache le vérificateur PIN de cette boutique.', error);
  }
};

export const saveStoreAdminPin = async (user: User, storeId: string, pin: string): Promise<void> => {
  assertStoreOwner(user, storeId);
  const verifier = await createAdminPinVerifier(pin);
  await setDoc(verifierRef(storeId), {
    ...verifier,
    updatedAt: serverTimestamp(),
    updatedBy: user.uid
  });
  cacheVerifier(storeId, verifier);
};

export const verifyStoreAdminPin = async (user: User, storeId: string, pin: string): Promise<boolean> => {
  assertStoreOwner(user, storeId);
  let verifier: AdminPinVerifier | null = null;
  try {
    const snapshot = await getDoc(verifierRef(storeId));
    if (!snapshot.exists()) {
      try { localStorage.removeItem(cacheKey(storeId)); } catch { /* Ignore unavailable storage. */ }
      return false;
    }
    const data = snapshot.data();
    verifier = {
      algorithm: data.algorithm,
      iterations: data.iterations,
      salt: data.salt,
      hash: data.hash
    };
    cacheVerifier(storeId, verifier);
  } catch (error) {
    verifier = readCachedVerifier(storeId);
    if (!verifier) throw error;
  }
  return verifyAdminPin(pin, verifier);
};

export const hasStoreAdminPin = async (user: User, storeId: string): Promise<boolean> => {
  assertStoreOwner(user, storeId);
  try {
    const snapshot = await getDoc(verifierRef(storeId));
    if (!snapshot.exists()) return false;
    const data = snapshot.data();
    cacheVerifier(storeId, {
      algorithm: data.algorithm,
      iterations: data.iterations,
      salt: data.salt,
      hash: data.hash
    });
    return true;
  } catch {
    return Boolean(readCachedVerifier(storeId));
  }
};
