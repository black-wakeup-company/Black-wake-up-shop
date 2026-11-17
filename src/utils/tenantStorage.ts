/**
 * Returns the localStorage key for a boutique.
 * Tenant data is isolated by the authenticated owner's stable store ID.
 * Omitting storeId intentionally preserves legacy single-store keys for migration.
 */
export const getScopedStorageKey = (key: string, storeId?: string): string =>
  storeId ? `boutiquepro:store:${storeId}:${key.toLowerCase()}:v1` : key;
