import test from 'node:test';
import assert from 'node:assert/strict';
import { getScopedStorageKey } from '../src/utils/tenantStorage.ts';

const legacyKeys = [
  'boutiquepro_workspace_mode_v2',
  'boutiquepro_cashiers_v2',
  'boutiquepro_active_cashier_v2',
  'boutiquepro_products_v2',
  'boutiquepro_customers_v2',
  'boutiquepro_sales_v2',
  'boutiquepro_expenses_v2',
  'boutiquepro_settings_v2',
  'boutiquepro_cash_session_v2'
];

test('tenant keys are stable for the same owner and isolated between owners', () => {
  for (const legacyKey of legacyKeys) {
    const firstOwnerKey = getScopedStorageKey(legacyKey, 'owner-alpha');
    const sameOwnerKey = getScopedStorageKey(legacyKey, 'owner-alpha');
    const secondOwnerKey = getScopedStorageKey(legacyKey, 'owner-beta');

    assert.equal(firstOwnerKey, sameOwnerKey);
    assert.notEqual(firstOwnerKey, secondOwnerKey);
    assert.match(firstOwnerKey, /^boutiquepro:store:owner-alpha:/);
    assert.match(secondOwnerKey, /^boutiquepro:store:owner-beta:/);
  }
});

test('without a tenant ID, legacy keys remain unchanged for explicit migration', () => {
  for (const legacyKey of legacyKeys) {
    assert.equal(getScopedStorageKey(legacyKey), legacyKey);
  }
});

test('data written by one owner remains available after switching accounts and returning', () => {
  const storage = new Map();
  const productsKeyA = getScopedStorageKey('boutiquepro_products_v2', 'owner-alpha');
  const productsKeyB = getScopedStorageKey('boutiquepro_products_v2', 'owner-beta');

  storage.set(productsKeyA, JSON.stringify([{ id: 'A-1', name: 'Produit A' }]));
  storage.set(productsKeyB, JSON.stringify([{ id: 'B-1', name: 'Produit B' }]));

  const ownerBProducts = JSON.parse(storage.get(productsKeyB));
  const ownerAReturnedProducts = JSON.parse(storage.get(productsKeyA));

  assert.deepEqual(ownerBProducts, [{ id: 'B-1', name: 'Produit B' }]);
  assert.deepEqual(ownerAReturnedProducts, [{ id: 'A-1', name: 'Produit A' }]);
});

test('all tenant data categories use distinct storage keys', () => {
  const tenantKeys = legacyKeys.map(key => getScopedStorageKey(key, 'owner-alpha'));
  assert.equal(new Set(tenantKeys).size, legacyKeys.length);
});
