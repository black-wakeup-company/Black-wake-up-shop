import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeTenantSettings } from '../src/utils/mergeTenantSettings.ts';

test('tenant settings keep the Firestore owner profile name over stale local settings', () => {
  const merged = mergeTenantSettings(
    { boutiqueName: 'Nom officiel', currencySymbol: 'FC' },
    { boutiqueName: 'Ancien nom local', address: 'Goma' },
    true
  );
  assert.deepEqual(merged, {
    boutiqueName: 'Nom officiel',
    currencySymbol: 'FC',
    address: 'Goma'
  });
});

test('tenant settings preserve local editable fields', () => {
  const merged = mergeTenantSettings(
    { boutiqueName: 'Nom officiel', currencySymbol: 'FC', address: '' },
    { address: 'Himbi', phone: '000' },
    true
  );
  assert.equal(merged.boutiqueName, 'Nom officiel');
  assert.equal(merged.address, 'Himbi');
  assert.equal(merged.phone, '000');
});

test('non-tenant settings retain legacy merge behavior', () => {
  const merged = mergeTenantSettings(
    { boutiqueName: 'Base' },
    { boutiqueName: 'Nom importé' },
    false
  );
  assert.equal(merged.boutiqueName, 'Nom importé');
});
