/**
 * Local-only reset for one tenant.
 *
 * This deliberately does not touch Firebase Authentication, Firestore,
 * project configuration, or any other tenant's browser data.
 * Call only after the owner has explicitly confirmed a reset.
 */
const SYNC_DATABASE = 'boutiquepro-sync';
const OUTBOX_STORE = 'outbox';

export interface TenantLocalResetResult {
  localStorageKeysRemoved: number;
  pendingSyncItemsRemoved: number;
}

const removeTenantLocalStorage = (storeId: string): number => {
  const prefix = `boutiquepro:store:${storeId}:`;
  const keys: string[] = [];

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (key?.startsWith(prefix)) keys.push(key);
  }

  keys.forEach((key) => localStorage.removeItem(key));
  return keys.length;
};

const removeTenantOutboxItems = async (storeId: string): Promise<number> => {
  if (typeof indexedDB === 'undefined') return 0;

  // Avoid opening (and thereby creating) the database if it does not exist.
  if (typeof indexedDB.databases === 'function') {
    const databases = await indexedDB.databases();
    if (!databases.some((database) => database.name === SYNC_DATABASE)) return 0;
  }

  const database = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(SYNC_DATABASE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Ouverture IndexedDB impossible.'));
    request.onblocked = () => reject(new Error('IndexedDB est bloquée par un autre onglet.'));
  });

  try {
    if (!database.objectStoreNames.contains(OUTBOX_STORE)) return 0;

    return await new Promise<number>((resolve, reject) => {
      let removed = 0;
      const transaction = database.transaction(OUTBOX_STORE, 'readwrite');
      const index = transaction.objectStore(OUTBOX_STORE).index('by-store-created');
      const range = IDBKeyRange.bound([storeId, ''], [storeId, '\\uffff']);
      const request = index.openCursor(range);

      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) return;
        cursor.delete();
        removed += 1;
        cursor.continue();
      };
      request.onerror = () => reject(request.error ?? new Error('Lecture de la file de synchronisation impossible.'));
      transaction.oncomplete = () => resolve(removed);
      transaction.onerror = () => reject(transaction.error ?? new Error('Nettoyage de la file de synchronisation impossible.'));
      transaction.onabort = () => reject(transaction.error ?? new Error('Nettoyage IndexedDB annulé.'));
    });
  } finally {
    database.close();
  }
};

/**
 * Removes only browser-local state and pending sync intents for the supplied
 * store ID. It does not delete the remote Firestore store or owner account.
 */
export const resetTenantLocalData = async (storeId: string): Promise<TenantLocalResetResult> => {
  if (!storeId.trim() || storeId.includes('/')) {
    throw new Error('Identifiant de boutique invalide.');
  }

  const pendingSyncItemsRemoved = await removeTenantOutboxItems(storeId);
  const localStorageKeysRemoved = removeTenantLocalStorage(storeId);

  return { localStorageKeysRemoved, pendingSyncItemsRemoved };
};
