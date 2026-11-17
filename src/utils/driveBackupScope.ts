export interface ScopedDriveBackupEnvelope {
  __blackWakeupBackup: { storeId: string; schemaVersion: 1 };
  [key: string]: unknown;
}

export const getDriveBackupStorageKey = (storeId: string, setting: 'last_backup' | 'auto_backup'): string =>
  `blackwakeup:store:${storeId}:drive:${setting}:v1`;

export const createScopedDriveBackup = (snapshotJson: string, storeId: string): string => {
  if (!storeId) throw new Error('Identifiant de boutique manquant.');
  const snapshot = JSON.parse(snapshotJson) as Record<string, unknown>;
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) {
    throw new Error('La sauvegarde de boutique est invalide.');
  }
  return JSON.stringify({
    ...snapshot,
    __blackWakeupBackup: { storeId, schemaVersion: 1 }
  });
};

export const extractScopedDriveBackup = (backupJson: string, expectedStoreId: string): string => {
  const backup = JSON.parse(backupJson) as Record<string, unknown>;
  const metadata = backup?.__blackWakeupBackup as { storeId?: unknown; schemaVersion?: unknown } | undefined;
  if (!metadata || metadata.schemaVersion !== 1 || metadata.storeId !== expectedStoreId) {
    throw new Error('Cette sauvegarde n’appartient pas à cette boutique ou utilise un ancien format non vérifié. Restauration refusée pour protéger vos données.');
  }
  const { __blackWakeupBackup: _metadata, ...snapshot } = backup;
  return JSON.stringify(snapshot);
};
