import { User } from 'firebase/auth';
import { doc, getFirestore, runTransaction, serverTimestamp } from 'firebase/firestore';
import { auth } from './firebase';

const db = getFirestore(auth.app);

export interface OwnerStore {
  storeId: string;
  ownerUid: string;
}

/**
 * Creates or retrieves the store belonging to the authenticated owner.
 * The Firebase UID is the store ID, so one owner account maps to one store.
 *
 * Call only after the matching Firestore rules have been installed and tested.
 */
export const getOrCreateOwnerStore = async (user: User): Promise<OwnerStore> => {
  if (!user.uid || auth.currentUser?.uid !== user.uid || !user.emailVerified) {
    throw new Error('Une session propriétaire valide avec adresse e-mail vérifiée est nécessaire.');
  }

  const storeId = user.uid;
  const storeRef = doc(db, 'stores', storeId);
  const ownerMemberRef = doc(db, 'stores', storeId, 'members', user.uid);

  return runTransaction(db, async (transaction) => {
    const [storeSnapshot, memberSnapshot] = await Promise.all([
      transaction.get(storeRef),
      transaction.get(ownerMemberRef)
    ]);

    if (storeSnapshot.exists() && memberSnapshot.exists()) {
      const store = storeSnapshot.data();
      const member = memberSnapshot.data();

      if (store.ownerUid !== user.uid || member.role !== 'owner' || member.active !== true) {
        throw new Error('Les informations de propriété de cette boutique sont incohérentes.');
      }
      return { storeId, ownerUid: user.uid };
    }

    if (storeSnapshot.exists() || memberSnapshot.exists()) {
      throw new Error('Configuration de boutique incomplète. Aucune donnée n’a été modifiée.');
    }

    transaction.set(storeRef, {
      ownerUid: user.uid,
      name: user.displayName?.trim() || 'Ma boutique',
      ownerEmail: user.email || null,
      createdAt: serverTimestamp(),
      schemaVersion: 1
    });

    transaction.set(ownerMemberRef, {
      uid: user.uid,
      role: 'owner',
      displayName: user.displayName || 'Propriétaire',
      email: user.email || null,
      active: true,
      createdAt: serverTimestamp()
    });

    return { storeId, ownerUid: user.uid };
  });
};
