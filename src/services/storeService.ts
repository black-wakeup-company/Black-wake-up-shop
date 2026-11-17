import { User } from 'firebase/auth';
import { doc, getDoc, getFirestore, runTransaction, serverTimestamp } from 'firebase/firestore';
import { auth } from './firebase';

const db = getFirestore(auth.app);

export interface OwnerStore {
  storeId: string;
  ownerUid: string;
  name?: string;
  industry?: string;
  primaryCurrency?: string;
}

export interface OwnerStoreProfile {
  name: string;
  industry?: string;
  primaryCurrency: string;
}

const assertCurrentVerifiedOwner = (user: User) => {
  if (!user.uid || auth.currentUser?.uid !== user.uid || !user.emailVerified) {
    throw new Error('Une session propriétaire Google valide avec adresse e-mail vérifiée est nécessaire.');
  }
};

/**
 * Read the store addressed by the authenticated user's UID.
 * A missing store is returned as null; provisioning is deferred until the owner
 * confirms the initial profile and primary currency.
 */
export const getOwnerStore = async (user: User): Promise<OwnerStore | null> => {
  assertCurrentVerifiedOwner(user);
  const storeId = user.uid;
  const storeRef = doc(db, 'stores', storeId);
  const memberRef = doc(db, 'stores', storeId, 'members', user.uid);
  const [storeSnapshot, memberSnapshot] = await Promise.all([getDoc(storeRef), getDoc(memberRef)]);

  if (!storeSnapshot.exists() && !memberSnapshot.exists()) return null;
  if (!storeSnapshot.exists() || !memberSnapshot.exists()) {
    throw new Error('Configuration de boutique incomplète. Aucune donnée n’a été modifiée. Contactez le support.');
  }

  const store = storeSnapshot.data();
  const member = memberSnapshot.data();
  if (store.ownerUid !== user.uid || member.uid !== user.uid || member.role !== 'owner' || member.active !== true) {
    throw new Error('Les informations de propriété de cette boutique sont incohérentes.');
  }

  return {
    storeId,
    ownerUid: user.uid,
    name: typeof store.name === 'string' ? store.name : undefined,
    industry: typeof store.industry === 'string' ? store.industry : undefined,
    primaryCurrency: typeof store.primaryCurrency === 'string' ? store.primaryCurrency : undefined
  };
};

/**
 * Creates a store only after the owner confirms its name and primary currency.
 * Existing stores can complete missing profile fields without creating duplicates.
 */
export const saveOwnerStoreProfile = async (
  user: User,
  profile: OwnerStoreProfile
): Promise<OwnerStore> => {
  assertCurrentVerifiedOwner(user);
  const name = profile.name.trim();
  const primaryCurrency = profile.primaryCurrency.trim().toUpperCase();
  const industry = profile.industry?.trim();

  if (!name || name.length > 100) throw new Error('Le nom de la boutique est obligatoire (100 caractères maximum).');
  if (!/^[A-Z]{3}$/.test(primaryCurrency)) throw new Error('Code de devise invalide. Utilisez un code de trois lettres.');

  const storeId = user.uid;
  const storeRef = doc(db, 'stores', storeId);
  const memberRef = doc(db, 'stores', storeId, 'members', user.uid);

  await runTransaction(db, async (transaction) => {
    const [storeSnapshot, memberSnapshot] = await Promise.all([
      transaction.get(storeRef),
      transaction.get(memberRef)
    ]);

    if (storeSnapshot.exists() && memberSnapshot.exists()) {
      const currentStore = storeSnapshot.data();
      const member = memberSnapshot.data();
      if (currentStore.ownerUid !== user.uid || member.uid !== user.uid || member.role !== 'owner' || member.active !== true) {
        throw new Error('Les informations de propriété de cette boutique sont incohérentes.');
      }
      transaction.update(storeRef, {
        name,
        industry: industry || null,
        primaryCurrency
      });
      return;
    }

    if (storeSnapshot.exists() || memberSnapshot.exists()) {
      throw new Error('Configuration de boutique incomplète. Aucune donnée n’a été modifiée.');
    }

    transaction.set(storeRef, {
      ownerUid: user.uid,
      name,
      industry: industry || null,
      primaryCurrency,
      ownerEmail: user.email || null,
      createdAt: serverTimestamp(),
      schemaVersion: 1
    });
    transaction.set(memberRef, {
      uid: user.uid,
      role: 'owner',
      displayName: user.displayName || 'Propriétaire',
      email: user.email || null,
      active: true,
      createdAt: serverTimestamp()
    });
  });

  return { storeId, ownerUid: user.uid, name, industry, primaryCurrency };
};
