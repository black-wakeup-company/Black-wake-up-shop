import 'fake-indexeddb/auto';
import test from 'node:test';
import assert from 'node:assert/strict';
import { syncOutbox } from '../src/services/syncOutbox.ts';

const now = '2026-11-10T12:00:00.000Z';
const mutation = (overrides = {}) => {
  const unique = Math.random().toString(36).slice(2);
  return ({
  id: `test-${unique}`,
  storeId: `boutique-${unique}`,
  entity: 'products',
  operation: 'create',
  documentId: 'product-001',
  payload: { id: 'product-001', name: 'Café' },
  createdAt: now,
  attempts: 0,
  ...overrides
  });
};

test('persists a pending mutation and returns it for its boutique only', async () => {
  const item = mutation();
  await syncOutbox.enqueue(item);
  assert.deepEqual(await syncOutbox.listPending(item.storeId), [item]);
  assert.deepEqual(await syncOutbox.listPending('boutique-beta'), []);
});

test('replaying the same idempotency key and intent does not duplicate a job', async () => {
  const item = mutation();
  await syncOutbox.enqueue(item);
  await syncOutbox.enqueue({ ...item });
  assert.equal((await syncOutbox.listPending(item.storeId)).filter(x => x.id === item.id).length, 1);
});

test('rejects reusing an idempotency key for a different intent', async () => {
  const item = mutation();
  await syncOutbox.enqueue(item);
  await assert.rejects(
    syncOutbox.enqueue({ ...item, payload: { id: item.documentId, name: 'Autre produit' } }),
    /clé d’idempotence/
  );
  assert.deepEqual(await syncOutbox.listPending(item.storeId), [item]);
});

test('records failures and removes a job only after acknowledgement', async () => {
  const item = mutation();
  await syncOutbox.enqueue(item);
  await syncOutbox.recordFailure(item.id, new Error('Réseau indisponible'));
  const [failed] = await syncOutbox.listPending(item.storeId);
  assert.equal(failed.attempts, 1);
  assert.equal(failed.lastError, 'Réseau indisponible');
  await syncOutbox.acknowledge(item.id);
  assert.equal((await syncOutbox.listPending(item.storeId)).some(x => x.id === item.id), false);
});

test('rejects forbidden operations and malformed payloads', async () => {
  await assert.rejects(syncOutbox.enqueue(mutation({ entity: 'stockMovements', operation: 'update' })));
  await assert.rejects(syncOutbox.enqueue(mutation({ entity: 'settings', operation: 'delete' })));
  await assert.rejects(syncOutbox.enqueue(mutation({ payload: [] })));
});
