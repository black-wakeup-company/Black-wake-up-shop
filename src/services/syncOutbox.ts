import type { StoreCollection } from './storeDataService';

export type SyncEntity = StoreCollection | 'stockMovements' | 'settings';
export type SyncOperation = 'create' | 'update' | 'delete';

export interface PendingSyncMutation {
  id: string;
  storeId: string;
  entity: SyncEntity;
  operation: SyncOperation;
  documentId: string;
  payload?: Record<string, unknown>;
  createdAt: string;
  attempts: number;
  lastError?: string;
}

const DATABASE_NAME = 'boutiquepro-sync';
const DATABASE_VERSION = 1;
const STORE_NAME = 'outbox';

let databasePromise: Promise<IDBDatabase> | undefined;

const openDatabase = (): Promise<IDBDatabase> => {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('Le stockage local sécurisé (IndexedDB) est indisponible sur cet appareil.'));
  }
  if (databasePromise) return databasePromise;

  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('by-store-created', ['storeId', 'createdAt'], { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      databasePromise = undefined;
      reject(request.error ?? new Error('Impossible d’ouvrir la file de synchronisation.'));
    };
    request.onblocked = () => {
      databasePromise = undefined;
      reject(new Error('La mise à jour du stockage est bloquée par un autre onglet ouvert.'));
    };
  });
  return databasePromise;
};

const validateMutation = (mutation: PendingSyncMutation): void => {
  if (!mutation.id.trim() || mutation.id !== mutation.id.trim() || mutation.id.includes('/')) {
    throw new Error('Clé d’idempotence invalide.');
  }
  if (!mutation.storeId.trim() || mutation.storeId.includes('/')) {
    throw new Error('Identifiant de boutique invalide.');
  }
  if (!mutation.documentId.trim() || mutation.documentId.includes('/')) {
    throw new Error('Identifiant de document invalide.');
  }
  if (!Number.isInteger(mutation.attempts) || mutation.attempts < 0) {
    throw new Error('Nombre de tentatives invalide.');
  }
  if (!['create', 'update', 'delete'].includes(mutation.operation)) {
    throw new Error('Opération de synchronisation invalide.');
  }
};

/**
 * Durable local outbox. It records intent only; it never contacts Firebase.
 * The caller must use the mutation id as an idempotency key when applying it.
 */
export const syncOutbox = {
  async enqueue(mutation: PendingSyncMutation): Promise<void> {
    validateMutation(mutation);
    const database = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const existing = store.get(mutation.id);
      existing.onsuccess = () => {
        // Re-enqueueing the same id is a no-op, preventing duplicate local jobs.
        if (!existing.result) store.add(mutation);
      };
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error('Échec de mise en file.'));
      transaction.onabort = () => reject(transaction.error ?? new Error('Mise en file annulée.'));
    });
  },

  async listPending(storeId: string): Promise<PendingSyncMutation[]> {
    if (!storeId.trim() || storeId.includes('/')) throw new Error('Identifiant de boutique invalide.');
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readonly');
      const request = transaction.objectStore(STORE_NAME).getAll();
      request.onsuccess = () => {
        const items = (request.result as PendingSyncMutation[])
          .filter((item) => item.storeId === storeId)
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
        resolve(items);
      };
      request.onerror = () => reject(request.error ?? new Error('Lecture de la file impossible.'));
    });
  },

  async recordFailure(id: string, error: unknown): Promise<void> {
    const database = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);
      request.onsuccess = () => {
        const item = request.result as PendingSyncMutation | undefined;
        if (item) {
          item.attempts += 1;
          item.lastError = error instanceof Error ? error.message : String(error);
          store.put(item);
        }
      };
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error('Impossible d’enregistrer l’échec.'));
      transaction.onabort = () => reject(transaction.error ?? new Error('Enregistrement de l’échec annulé.'));
    });
  },

  async acknowledge(id: string): Promise<void> {
    const database = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).delete(id);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error('Impossible de confirmer la synchronisation.'));
      transaction.onabort = () => reject(transaction.error ?? new Error('Confirmation de synchronisation annulée.'));
    });
  }
};
