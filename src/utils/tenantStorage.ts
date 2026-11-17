/**
 * Returns the localStorage key for a boutique.
 * Tenant data is isolated by the authenticated owner's stable store ID.
 * Without a tenant ID, the exact legacy key is retained for explicit migration.
 */
export const getScopedStorageKey = (key: string, storeId?: string, legacyKey = key): string =>
  storeId ? `boutiquepro:store:${storeId}:${key.toLowerCase()}:v1` : legacyKey;
