/**
 * Scope resolver for jurisdiction-based filtering
 * Converts various scope representations into a canonical normalized key
 */

export function normalizeScopeKey(scopeParam: string): string {
  // Split by comma, trim, remove prefixes, sort, and dedupe
  const parts = scopeParam
    .split(',')
    .map(s => {
      const trimmed = s.trim();
      // Remove prefix if present (city:, county:, state:)
      const match = trimmed.match(/^(?:city|county|state):(.+)$/);
      return match ? match[1] : trimmed;
    })
    .filter(Boolean);

  // Sort and dedupe
  const unique = Array.from(new Set(parts)).sort();
  
  return unique.join(',');
}

export function scopeToJurisdictionSlugs(scopeParam: string): string[] {
  const normalized = normalizeScopeKey(scopeParam);
  return normalized ? normalized.split(',') : [];
}

export function jurisdictionSlugsToScopeKey(slugs: string[]): string {
  return Array.from(new Set(slugs)).sort().join(',');
}
