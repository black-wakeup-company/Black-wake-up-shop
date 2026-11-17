import test from 'node:test';
import assert from 'node:assert/strict';
import { getScopedStorageKey } from '../src/utils/tenantStorage.ts';

const storageCategories = [
  ['WORKSPACE_MODE', 'boutiquepro_workspace_mode_v2'],
  ['CASHIERS', 'boutiquepro_cashiers_v2'],
  ['ACTIVE_CASHIER', 'boutiquepro_active_cashier_v2'],
  ['PRODUCTS', 'boutiquepro_products_v2'],
  ['CUSTOMERS', 'boutiquepro_customers_v2'],
  ['SALES', 'boutiquepro_sales_v2'],
  ['EXPENSES', 'boutiquepro_expenses_v2'],
  ['SETTINGS', 'boutiquepro_settings_v2'],
  ['CASH_SESSION', 'boutiquepro_cash_session_v2']
];

test('tenant keys are stable for the same owner and isolated between owners', () => {
  for (const [category] of storageCategories) {
    const firstOwnerKey = getScopedStorageKey(category, 'owner-alpha');
    const sameOwnerKey = getScopedStorageKey(category, 'owner-alpha');
    const secondOwnerKey = getScopedStorageKey(category, 'owner-beta');
    assert.equal(firstOwnerKey, sameOwnerKey);
    assert.notEqual(firstOwnerKey, secondOwnerKey);
    assert.equal(firstOwnerKey, `boutiquepro:store:owner-alpha:${category.toLowerCase()}:v1`);
    assert.equal(secondOwnerKey, `boutiquepro:store:owner-beta:${category.toLowerCase()}:v1`);
  }
});

test('without a tenant ID, the exact legacy keys remain unchanged for migration', () => {
  for (const [category, legacyKey] of storageCategories) {
    assert.equal(getScopedStorageKey(category, undefined, legacyKey), legacyKey);
  }
});

test('data written by one owner remains available after switching accounts and returning', () => {
  const storage = new Map();
  const productsKeyA = getScopedStorageKey('PRODUCTS', 'owner-alpha', 'boutiquepro_products_v2');
  const productsKeyB = getScopedStorageKey('PRODUCTS', 'owner-beta', 'boutiquepro_products_v2');
  storage.set(productsKeyA, JSON.stringify([{ id: 'A-1', name: 'Produit A' }]));
  storage.set(productsKeyB, JSON.stringify([{ id: 'B-1', name: 'Produit B' }]));
  assert.deepEqual(JSON.parse(storage.get(productsKeyB)), [{ id: 'B-1', name: 'Produit B' }]);
  assert.deepEqual(JSON.parse(storage.get(productsKeyA)), [{ id: 'A-1', name: 'Produit A' }]);
});

test('all tenant data categories use distinct storage keys', () => {
  const tenantKeys = storageCategories.map(([category, legacyKey]) =>
    getScopedStorageKey(category, 'owner-alpha', legacyKey)
  );
  assert.equal(new Set(tenantKeys).size, storageCategories.length);
});
