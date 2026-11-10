import { getIdToken, reload, type User } from 'firebase/auth';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import { app, auth } from './firebase';

const db = getFirestore(app);

export type OwnerMembershipResolution =
  | { status: 'unauthenticated' }
  | { status: 'email-unverified' }
  | { status: 'not-provisioned'; storeId: string }
  | { status: 'inconsistent'; storeId: string }
  | { status: 'owner'; storeId: string; ownerUid: string };

/**
 * Read-only verification of an owner's own boutique membership.
 *
 * This function deliberately does not provision a store, query other stores,
 * or grant permissions based on client-supplied role data. It is not connected
 * to the UI or sync coordinator until Firestore rules and emulator tests pass.
 */
export const resolveOwnerMembership = async (
  candidateUser: User | null = auth.currentUser
): Promise<OwnerMembershipResolution> => {
  if (!candidateUser) return { status: 'unauthenticated' };

  if (auth.currentUser?.uid !== candidateUser.uid) {
    throw new Error('La session Firebase a changé. Reconnectez-vous puis réessayez.');
  }

  await reload(candidateUser);
  // Refresh the ID token too: Firestore rules evaluate email_verified from its claims.
  await getIdToken(candidateUser, true);

  if (auth.currentUser?.uid !== candidateUser.uid) {
    throw new Error('La session Firebase a changé pendant la vérification.');
  }

  if (!candidateUser.emailVerified) {
    return { status: 'email-unverified' };
  }

  // Owners use their authenticated UID as the boutique ID. Employee lookup
  // requires a separate trusted invitation context and is intentionally absent.
  const storeId = candidateUser.uid;
  const storeRef = doc(db, 'stores', storeId);
  const memberRef = doc(db, 'stores', storeId, 'members', candidateUser.uid);

  const [storeSnapshot, memberSnapshot] = await Promise.all([
    getDoc(storeRef),
    getDoc(memberRef)
  ]);

  if (!storeSnapshot.exists() && !memberSnapshot.exists()) {
    return { status: 'not-provisioned', storeId };
  }

  if (!storeSnapshot.exists() || !memberSnapshot.exists()) {
    return { status: 'inconsistent', storeId };
  }

  const store = storeSnapshot.data();
  const member = memberSnapshot.data();

  if (
    store.ownerUid !== candidateUser.uid
    || member.uid !== candidateUser.uid
    || member.role !== 'owner'
    || member.active !== true
  ) {
    return { status: 'inconsistent', storeId };
  }

  return { status: 'owner', storeId, ownerUid: candidateUser.uid };
};
