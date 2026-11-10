import { User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  setDoc,
  updateDoc
} from 'firebase/firestore';
import { auth } from './firebase';
import type {
  Product,
  Customer,
  Sale,
  Expense,
  CashSession,
  BoutiqueSettings
} from '../types/boutique';

const db = getFirestore(auth.app);

export type StoreCollection =
  | 'products'
  | 'customers'
  | 'sales'
  | 'expenses'
  | 'cashSessions';

export interface StoreDocumentMap {
  products: Product;
  customers: Customer;
  sales: Sale;
  expenses: Expense;
  cashSessions: CashSession;
}

const requireAuthenticatedUser = (user?: User): User => {
  const currentUser = auth.currentUser;
  if (!currentUser || (user && currentUser.uid !== user.uid)) {
    throw new Error('Une session authentifiée est nécessaire pour accéder aux données.');
  }
  return currentUser;
};

const requireStoreId = (storeId: string): string => {
  const normalized = storeId.trim();
  if (!normalized || normalized.includes('/')) {
    throw new Error('Identifiant de boutique invalide.');
  }
  return normalized;
};

const storeCollectionRef = (storeId: string, name: StoreCollection) => {
  return collection(db, 'stores', requireStoreId(storeId), name);
};

const storeDocumentRef = (storeId: string, name: StoreCollection, id: string) => {
  const normalizedId = id.trim();
  if (!normalizedId || normalizedId.includes('/')) {
    throw new Error('Identifiant de document invalide.');
  }
  return doc(storeCollectionRef(storeId, name), normalizedId);
};

/**
 * Tenant-scoped Firestore data access.
 *
 * Every operation is explicitly scoped below stores/{storeId}. Firestore
 * Security Rules remain the authority for membership and role permissions;
 * this client-side check is only a session sanity check, not authorization.
 *
 * Do not connect these methods to the UI until matching collection-specific
 * Firestore rules have been deployed and tested.
 */
export const storeDataService = {
  async list<T extends StoreCollection>(
    storeId: string,
    name: T,
    user?: User
  ): Promise<StoreDocumentMap[T][]> {
    requireAuthenticatedUser(user);
    const snapshot = await getDocs(storeCollectionRef(storeId, name));
    return snapshot.docs.map((item) => {
      const data = item.data();
      if (typeof data.id !== 'string' || data.id !== item.id) {
        throw new Error(`Document ${item.id} incohérent dans ${name} : son identifiant interne ne correspond pas.`);
      }
      return data as StoreDocumentMap[T];
    });
  },

  async get<T extends StoreCollection>(
    storeId: string,
    name: T,
    id: string,
    user?: User
  ): Promise<StoreDocumentMap[T] | null> {
    requireAuthenticatedUser(user);
    const snapshot = await getDoc(storeDocumentRef(storeId, name, id));
    return snapshot.exists() ? snapshot.data() as StoreDocumentMap[T] : null;
  },

  async create<T extends StoreCollection>(
    storeId: string,
    name: T,
    item: StoreDocumentMap[T],
    user?: User
  ): Promise<void> {
    requireAuthenticatedUser(user);
    if (!item.id || !item.id.trim()) {
      throw new Error('Un identifiant est obligatoire pour créer ce document.');
    }
    await setDoc(storeDocumentRef(storeId, name, item.id), item);
  },

  async update<T extends StoreCollection>(
    storeId: string,
    name: T,
    id: string,
    changes: Partial<Omit<StoreDocumentMap[T], 'id'>>,
    user?: User
  ): Promise<void> {
    requireAuthenticatedUser(user);
    await updateDoc(storeDocumentRef(storeId, name, id), changes);
  },

  async remove<T extends StoreCollection>(
    storeId: string,
    name: T,
    id: string,
    user?: User
  ): Promise<void> {
    requireAuthenticatedUser(user);
    await deleteDoc(storeDocumentRef(storeId, name, id));
  },

  async getSettings(storeId: string, user?: User): Promise<BoutiqueSettings | null> {
    requireAuthenticatedUser(user);
    const snapshot = await getDoc(doc(db, 'stores', requireStoreId(storeId), 'settings', 'main'));
    return snapshot.exists() ? snapshot.data() as BoutiqueSettings : null;
  },

  async saveSettings(
    storeId: string,
    settings: BoutiqueSettings,
    user?: User
  ): Promise<void> {
    requireAuthenticatedUser(user);
    await setDoc(doc(db, 'stores', requireStoreId(storeId), 'settings', 'main'), settings);
  }
};
