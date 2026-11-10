import { doc, getFirestore, runTransaction, type Firestore } from 'firebase/firestore';
import { auth } from './firebase';
import type { PendingSyncMutation } from './syncOutbox';
import type { SyncActor, SyncAdapter } from './syncCoordinator';

const db = getFirestore(auth.app);

const collections = new Set([
  'products',
  'customers',
  'sales',
  'expenses',
  'cashSessions'
]);

const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, canonicalize(nested)])
    );
  }
  return value;
};

const samePayload = (left: unknown, right: unknown): boolean =>
  JSON.stringify(canonicalize(left)) === JSON.stringify(canonicalize(right));

const validatePayload = (
  mutation: PendingSyncMutation,
  actor: SyncActor
): Record<string, unknown> => {
  const payload = mutation.payload;
  if (!payload) throw new Error('Contenu manquant : création Firebase refusée.');

  if (mutation.entity === 'settings') {
    if (mutation.documentId !== 'main') {
      throw new Error('Les paramètres doivent cibler le document principal.');
    }
    return payload;
  }

  if (mutation.entity === 'stockMovements') {
    if (payload.id !== mutation.documentId || payload.createdBy !== actor.uid) {
      throw new Error('Identité ou auteur du mouvement de stock incohérent.');
    }
    if (typeof payload.productId !== 'string'
      || !payload.productId.trim()
      || typeof payload.createdAt !== 'string'
      || !Number.isFinite(payload.quantityDelta)
      || payload.quantityDelta === 0
      || !['sale', 'refund', 'restock', 'adjustment'].includes(String(payload.reason))) {
      throw new Error('Contenu du mouvement de stock invalide.');
    }
    return payload;
  }

  if (!collections.has(mutation.entity)) {
    throw new Error(`Collection non prise en charge : ${mutation.entity}.`);
  }

  const storageId = mutation.entity === 'sales' && typeof payload.syncId === 'string'
    ? payload.syncId
    : payload.id;

  if (typeof storageId !== 'string' || storageId !== mutation.documentId) {
    throw new Error('L’identifiant technique du contenu ne correspond pas à la cible.');
  }
  if (typeof payload.id !== 'string' || !payload.id.trim()) {
    throw new Error('Identifiant métier manquant.');
  }
  return payload;
};

/**
 * Safe first-stage Firebase adapter.
 *
 * Only CREATE is enabled. A transaction reads the target before writing:
 * - missing target: create it;
 * - identical existing target: treat as an idempotent retry;
 * - different existing target: reject without overwriting.
 *
 * Updates/deletes remain deliberately disabled until the outbox carries an
 * expected revision and the conflict policy is covered by tests.
 * This adapter is not connected to the UI or sync coordinator.
 */
export const createFirebaseSyncAdapter = (database: Firestore = db): SyncAdapter => ({
  async apply(mutation, actor) {
    if (mutation.storeId !== actor.storeId) {
      throw new Error('La mutation ne correspond pas à la boutique authentifiée.');
    }
    if (mutation.operation !== 'create') {
      throw new Error(
        'Synchronisation bloquée : les modifications et suppressions nécessitent un contrôle de version.'
      );
    }

    const payload = validatePayload(mutation, actor);
    const target = mutation.entity === 'settings'
      ? doc(database, 'stores', mutation.storeId, 'settings', 'main')
      : doc(database, 'stores', mutation.storeId, mutation.entity, mutation.documentId);

    await runTransaction(database, async (transaction) => {
      const snapshot = await transaction.get(target);
      if (snapshot.exists()) {
        if (samePayload(snapshot.data(), payload)) return;
        throw new Error(
          `Conflit de création : le document ${mutation.documentId} existe déjà avec un contenu différent.`
        );
      }
      transaction.set(target, payload);
    });
  }
});
