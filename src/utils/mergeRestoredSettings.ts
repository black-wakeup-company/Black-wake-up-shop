import type { BoutiqueSettings } from '../types/boutique';

/**
 * Merge a restored snapshot without allowing tenant backups to replace the
 * currently active boutique identity or its supported base currency.
 */
export const mergeRestoredSettings = (
  current: BoutiqueSettings,
  imported: Partial<BoutiqueSettings>,
  isTenant: boolean
): BoutiqueSettings => {
  const merged = { ...current, ...imported };
  if (!isTenant) return merged;

  return {
    ...merged,
    boutiqueName: current.boutiqueName,
    currencySymbol: current.currencySymbol
  };
};
