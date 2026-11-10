import type { PendingSyncMutation, SyncEntity, SyncOperation } from './syncOutbox';
import { syncOutbox } from './syncOutbox';

export type SyncRole = 'owner' | 'manager' | 'cashier';

export interface SyncActor {
  uid: string;
  emailVerified: boolean;
  storeId: string;
  role: SyncRole;
  active: boolean;
}

export interface SyncAdapter {
  /**
   * Must apply one mutation idempotently using mutation.id as its idempotency
   * key. It must reject conflicting creates/updates rather than overwrite data.
   * This coordinator deliberately does not provide a Firebase adapter yet.
   */
  apply(mutation: PendingSyncMutation, actor: SyncActor): Promise<void>;
}

export interface SyncOutboxPort {
  listPending(storeId: string): Promise<PendingSyncMutation[]>;
  recordFailure(storeId: string, id: string, error: unknown): Promise<void>;
  acknowledge(storeId: string, id: string): Promise<void>;
}

export interface SyncResult {
  processed: number;
  acknowledged: number;
  failed: number;
  skipped: number;
}

const permissions: Record<SyncEntity, Record<SyncOperation, SyncRole[]>> = {
  products: { create: ['owner', 'manager'], update: ['owner', 'manager'], delete: ['owner', 'manager'] },
  customers: { create: ['owner', 'manager', 'cashier'], update: ['owner', 'manager', 'cashier'], delete: ['owner', 'manager'] },
  sales: { create: ['owner', 'manager', 'cashier'], update: ['owner', 'manager'], delete: ['owner'] },
  expenses: { create: ['owner', 'manager'], update: ['owner', 'manager'], delete: ['owner'] },
  cashSessions: { create: ['owner', 'manager', 'cashier'], update: ['owner', 'manager', 'cashier'], delete: ['owner'] },
  stockMovements: { create: ['owner', 'manager', 'cashier'], update: [], delete: [] },
  settings: { create: ['owner'], update: ['owner'], delete: [] }
};

const validateActor = (actor: SyncActor, expectedStoreId: string): void => {
  if (!actor.uid || !actor.uid.trim()) throw new Error('Utilisateur non authentifié.');
  if (!actor.emailVerified) throw new Error('Adresse email non vérifiée : synchronisation refusée.');
  if (!actor.active) throw new Error('Adhésion à la boutique inactive.');
  if (!actor.storeId || actor.storeId !== expectedStoreId) {
    throw new Error('La boutique active ne correspond pas à la boutique de la tâche.');
  }
};

const validatePermission = (mutation: PendingSyncMutation, actor: SyncActor): void => {
  if (!permissions[mutation.entity][mutation.operation].includes(actor.role)) {
    throw new Error(`Le rôle ${actor.role} ne peut pas effectuer ${mutation.operation} sur ${mutation.entity}.`);
  }
  if ((mutation.operation === 'create' || mutation.operation === 'update') && !mutation.payload) {
    throw new Error('Le contenu de la mutation est manquant.');
  }
  if (mutation.entity === 'settings' && mutation.documentId !== 'main') {
    throw new Error('Les paramètres doivent cibler le document principal.');
  }
  if (mutation.entity === 'stockMovements' && mutation.operation !== 'create') {
    throw new Error('Les mouvements de stock sont des événements non modifiables.');
  }
};

export const createSyncCoordinator = (
  getActor: () => Promise<SyncActor | null>,
  adapter: SyncAdapter,
  outbox: SyncOutboxPort = syncOutbox
) => ({
  async synchronize(storeId: string): Promise<SyncResult> {
    if (!storeId.trim() || storeId.includes('/')) throw new Error('Identifiant de boutique invalide.');
    const actor = await getActor();
    if (!actor) throw new Error('Aucun utilisateur connecté.');
    validateActor(actor, storeId);

    const pending = await outbox.listPending(storeId);
    const result: SyncResult = { processed: 0, acknowledged: 0, failed: 0, skipped: 0 };

    for (const mutation of pending) {
      result.processed += 1;
      try {
        // Re-read identity before each write; account/store switches stop the batch.
        const currentActor = await getActor();
        if (!currentActor) throw new Error('Session expirée pendant la synchronisation.');
        validateActor(currentActor, storeId);
        if (mutation.storeId !== storeId) throw new Error('Tâche étrangère à la boutique active.');
        validatePermission(mutation, currentActor);
        await adapter.apply(mutation, currentActor);
        await outbox.acknowledge(storeId, mutation.id);
        result.acknowledged += 1;
      } catch (error) {
        await outbox.recordFailure(storeId, mutation.id, error);
        result.failed += 1;
        if (error instanceof Error && /boutique active|Utilisateur non authentifié|Session expirée|Adresse email|Adhésion/.test(error.message)) {
          result.skipped += pending.length - result.processed;
          break;
        }
      }
    }
    return result;
  }
});
