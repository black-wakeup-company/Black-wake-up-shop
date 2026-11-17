/**
 * Merge locally saved settings while keeping the owner profile's canonical
 * boutique name authoritative for a tenant.
 */
export const mergeTenantSettings = <T extends { boutiqueName?: string }>(
  baseSettings: T,
  savedSettings: Partial<T>,
  isTenant: boolean
): T => {
  const merged = { ...baseSettings, ...savedSettings };
  if (isTenant && typeof baseSettings.boutiqueName === 'string' && baseSettings.boutiqueName.trim()) {
    merged.boutiqueName = baseSettings.boutiqueName;
  }
  return merged;
};
