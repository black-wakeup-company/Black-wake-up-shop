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
  if (!['products', 'customers', 'sales', 'expenses', 'cashSessions', 'stockMovements', 'settings'].includes(mutation.entity)) {
    throw new Error('Type de donnée à synchroniser invalide.');
  }
  if ((mutation.entity === 'stockMovements' && mutation.operation !== 'create')
    || (mutation.entity === 'settings' && mutation.operation === 'delete')) {
    throw new Error('Cette opération est interdite pour ce type de donnée.');
  }
  if (Number.isNaN(Date.parse(mutation.createdAt))) {
    throw new Error('Date de création de la tâche invalide.');
  }
  if (mutation.payload !== undefined
    && (mutation.payload === null || typeof mutation.payload !== 'object' || Array.isArray(mutation.payload))) {
    throw new Error('Contenu de synchronisation invalide.');
  }

  // A queued payload must never silently target another document.
  // Sales keep a human-readable receipt id and use syncId as their storage key.
  if (mutation.payload && typeof mutation.payload.id === 'string') {
    const payloadDocumentId = mutation.entity === 'sales'
      && typeof mutation.payload.syncId === 'string'
      ? mutation.payload.syncId
      : mutation.payload.id;
    if (payloadDocumentId !== mutation.documentId) {
      throw new Error('Le document ciblé ne correspond pas à son identifiant dans le contenu.');
    }
  }
  if (mutation.entity === 'settings' && mutation.documentId !== 'main') {
    throw new Error('Les paramètres de boutique doivent cibler le document principal.');
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
      let collision = false;
      existing.onsuccess = () => {
        const previous = existing.result as PendingSyncMutation | undefined;
        if (!previous) {
          store.add(mutation);
          return;
        }
        // An idempotency key may be replayed, but never reused for another intent.
        const sameIntent = previous.storeId === mutation.storeId
          && previous.entity === mutation.entity
          && previous.operation === mutation.operation
          && previous.documentId === mutation.documentId
          && JSON.stringify(previous.payload ?? null) === JSON.stringify(mutation.payload ?? null);
        if (!sameIntent) {
          collision = true;
          transaction.abort();
        }
      };
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error('Échec de mise en file.'));
      transaction.onabort = () => reject(collision
        ? new Error('Cette clé d’idempotence est déjà utilisée pour une autre opération.')
        : transaction.error ?? new Error('Mise en file annulée.'));
    });
  },

  async listPending(storeId: string): Promise<PendingSyncMutation[]> {
    if (!storeId.trim() || storeId.includes('/')) throw new Error('Identifiant de boutique invalide.');
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readonly');
      const range = IDBKeyRange.bound([storeId, ''], [storeId, '\uffff']);
      const request = transaction.objectStore(STORE_NAME).index('by-store-created').getAll(range);
      request.onsuccess = () => {
        const items = (request.result as PendingSyncMutation[])
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
        resolve(items);
      };
      request.onerror = () => reject(request.error ?? new Error('Lecture de la file impossible.'));
    });
  },

  async recordFailure(storeId: string, id: string, error: unknown): Promise<void> {
    const database = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);
      request.onsuccess = () => {
        const item = request.result as PendingSyncMutation | undefined;
        if (item && item.storeId === storeId) {
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

  async acknowledge(storeId: string, id: string): Promise<void> {
    const database = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);
      request.onsuccess = () => {
        const item = request.result as PendingSyncMutation | undefined;
        if (item && item.storeId === storeId) store.delete(id);
      };
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error('Impossible de confirmer la synchronisation.'));
      transaction.onabort = () => reject(transaction.error ?? new Error('Confirmation de synchronisation annulée.'));
    });
  }
};
