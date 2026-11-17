import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeRestoredSettings } from '../src/utils/mergeRestoredSettings.ts';

const current = {
  boutiqueName: 'Boutique Alpha',
  currencySymbol: 'FC',
  address: 'Goma',
  phone: '000'
};

test('tenant restore preserves the active boutique name and base currency', () => {
  const restored = mergeRestoredSettings(current, {
    boutiqueName: 'Ancienne boutique',
    currencySymbol: 'USD',
    address: 'Bukavu',
    phone: '111'
  }, true);

  assert.equal(restored.boutiqueName, 'Boutique Alpha');
  assert.equal(restored.currencySymbol, 'FC');
  assert.equal(restored.address, 'Bukavu');
  assert.equal(restored.phone, '111');
});

test('tenant restore merges partial settings without dropping existing fields', () => {
  const restored = mergeRestoredSettings(current, { address: 'Kinshasa' }, true);
  assert.deepEqual(restored, { ...current, address: 'Kinshasa' });
});

test('legacy non-tenant restore retains its imported settings behavior', () => {
  const restored = mergeRestoredSettings(current, {
    boutiqueName: 'Ancienne boutique',
    currencySymbol: 'USD'
  }, false);
  assert.equal(restored.boutiqueName, 'Ancienne boutique');
  assert.equal(restored.currencySymbol, 'USD');
});
