import test from 'node:test';
import assert from 'node:assert/strict';
import { createScopedDriveBackup, extractScopedDriveBackup, getDriveBackupStorageKey } from '../src/utils/driveBackupScope.ts';

test('Drive backup is tagged to the owning store and round-trips without metadata leakage', () => {
  const original = JSON.stringify({ products: [{ id: 'p1' }], settings: { boutiqueName: 'Alpha' } });
  const wrapped = createScopedDriveBackup(original, 'owner-alpha');
  assert.deepEqual(JSON.parse(extractScopedDriveBackup(wrapped, 'owner-alpha')), JSON.parse(original));
});

test('Drive restore refuses a backup belonging to another store', () => {
  const wrapped = createScopedDriveBackup(JSON.stringify({ products: [] }), 'owner-alpha');
  assert.throws(() => extractScopedDriveBackup(wrapped, 'owner-beta'), /n’appartient pas/);
});

test('Drive restore refuses legacy unscoped backups instead of risking cross-store overwrite', () => {
  assert.throws(() => extractScopedDriveBackup(JSON.stringify({ products: [] }), 'owner-alpha'), /ancien format non vérifié/);
});

test('Drive preferences and last-backup timestamps are isolated by store', () => {
  assert.notEqual(getDriveBackupStorageKey('owner-alpha', 'auto_backup'), getDriveBackupStorageKey('owner-beta', 'auto_backup'));
  assert.notEqual(getDriveBackupStorageKey('owner-alpha', 'last_backup'), getDriveBackupStorageKey('owner-beta', 'last_backup'));
});
