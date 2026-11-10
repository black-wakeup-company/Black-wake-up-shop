import test from 'node:test';
import assert from 'node:assert/strict';
import { createSyncCoordinator } from '../src/services/syncCoordinator.ts';

const actor = (overrides = {}) => ({
  uid: 'owner-1', emailVerified: true, storeId: 'store-1',
  role: 'owner', active: true, ...overrides
});
const job = (overrides = {}) => ({
  id: 'job-1', storeId: 'store-1', entity: 'products', operation: 'create',
  documentId: 'product-1', payload: { id: 'product-1' },
  createdAt: '2026-11-10T12:00:00.000Z', attempts: 0, ...overrides
});
const harness = (jobs, apply = async () => {}, getActor = async () => actor()) => {
  const state = { pending: [...jobs], failures: [], acknowledged: [] };
  const outbox = {
    async listPending(storeId) { return state.pending.filter(item => item.storeId === storeId); },
    async recordFailure(storeId, id, error) { state.failures.push({ storeId, id, message: String(error) }); },
    async acknowledge(storeId, id) {
      state.acknowledged.push({ storeId, id });
      state.pending = state.pending.filter(item => !(item.storeId === storeId && item.id === id));
    }
  };
  return { state, coordinator: createSyncCoordinator(getActor, { apply }, outbox) };
};

test('applies and acknowledges a permitted mutation only after adapter success', async () => {
  const seen = [];
  const { state, coordinator } = harness([job()], async (mutation, currentActor) => seen.push([mutation.id, currentActor.uid]));
  const result = await coordinator.synchronize('store-1');
  assert.deepEqual(result, { processed: 1, acknowledged: 1, failed: 0, skipped: 0 });
  assert.deepEqual(seen, [['job-1', 'owner-1']]);
  assert.equal(state.pending.length, 0);
});

test('retains a mutation when remote adapter fails', async () => {
  const { state, coordinator } = harness([job()], async () => { throw new Error('network down'); });
  const result = await coordinator.synchronize('store-1');
  assert.equal(result.failed, 1);
  assert.equal(state.pending.length, 1);
  assert.match(state.failures[0].message, /network down/);
});

test('refuses unverified, inactive, or cross-store actors before writing', async () => {
  for (const identity of [{ emailVerified: false }, { active: false }, { storeId: 'other-store' }]) {
    let writes = 0;
    const { coordinator } = harness([job()], async () => { writes += 1; }, async () => actor(identity));
    await assert.rejects(coordinator.synchronize('store-1'));
    assert.equal(writes, 0);
  }
});

test('enforces employee permissions and append-only stock movements', async () => {
  const cashierExpense = job({ entity: 'expenses' });
  const cashierMovement = job({ entity: 'stockMovements', documentId: 'move-1', payload: { id: 'move-1' } });
  let writes = 0;
  const { state, coordinator } = harness([cashierExpense, cashierMovement], async () => { writes += 1; }, async () => actor({ role: 'cashier' }));
  const result = await coordinator.synchronize('store-1');
  assert.equal(writes, 1);
  assert.equal(result.failed, 1);
  assert.equal(result.acknowledged, 1);
  assert.equal(state.pending.length, 1);
});

test('rechecks the active identity between queued writes', async () => {
  let calls = 0;
  const { state, coordinator } = harness([job(), job({ id: 'job-2', documentId: 'product-2', payload: { id: 'product-2' } })],
    async () => {},
    async () => (++calls === 1 ? actor() : actor({ storeId: 'other-store' })));
  const result = await coordinator.synchronize('store-1');
  assert.equal(result.acknowledged, 0);
  assert.equal(result.failed, 1);
  assert.equal(result.skipped, 1);
  assert.equal(state.pending.length, 2);
});
