// SessionStorage utilities for tracked terms (demo mode)

export interface TrackedTerm {
  id: string;
  name: string;
  keywords: string[];
  jurisdictions: any[];
  active: boolean;
  alertEnabled: boolean;
  createdAt: string;
  matchCount: number;
}

const TRACKED_TERMS_KEY = 'trackedTerms';

export function getAllTrackedTerms(): TrackedTerm[] {
  if (typeof window === 'undefined') return [];
  
  const stored = sessionStorage.getItem(TRACKED_TERMS_KEY);
  if (!stored) return [];
  
  try {
    const termsObj = JSON.parse(stored);
    return Object.values(termsObj);
  } catch {
    return [];
  }
}

export function getTrackedTerm(id: string): TrackedTerm | null {
  if (typeof window === 'undefined') return null;
  
  const stored = sessionStorage.getItem(TRACKED_TERMS_KEY);
  if (!stored) return null;
  
  try {
    const termsObj = JSON.parse(stored);
    return termsObj[id] || null;
  } catch {
    return null;
  }
}

export function createTrackedTerm(term: Omit<TrackedTerm, 'id' | 'createdAt' | 'matchCount'>): TrackedTerm {
  if (typeof window === 'undefined') throw new Error('Window not available');
  
  const newTerm: TrackedTerm = {
    id: crypto.randomUUID(),
    ...term,
    createdAt: new Date().toISOString(),
    matchCount: 0
  };
  
  const existing = JSON.parse(sessionStorage.getItem(TRACKED_TERMS_KEY) || '{}');
  existing[newTerm.id] = newTerm;
  sessionStorage.setItem(TRACKED_TERMS_KEY, JSON.stringify(existing));
  
  return newTerm;
}

export function updateTrackedTerm(id: string, updates: Partial<TrackedTerm>): void {
  if (typeof window === 'undefined') return;
  
  const stored = JSON.parse(sessionStorage.getItem(TRACKED_TERMS_KEY) || '{}');
  if (stored[id]) {
    stored[id] = { ...stored[id], ...updates };
    sessionStorage.setItem(TRACKED_TERMS_KEY, JSON.stringify(stored));
  }
}

export function deleteTrackedTerm(id: string): void {
  if (typeof window === 'undefined') return;
  
  const stored = JSON.parse(sessionStorage.getItem(TRACKED_TERMS_KEY) || '{}');
  delete stored[id];
  sessionStorage.setItem(TRACKED_TERMS_KEY, JSON.stringify(stored));
}
