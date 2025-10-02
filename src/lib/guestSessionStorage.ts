// Session storage utilities for guest scope and topics
// Used for multi-location selection and topic preferences

const GUEST_SCOPE_KEY = 'guest_scope';
const GUEST_TOPICS_KEY = 'guest_topics';

export interface GuestScope {
  jurisdictions: string[]; // Array of jurisdiction slugs, max 3
}

export function getGuestScope(): string[] {
  if (typeof window === 'undefined') return [];
  const stored = sessionStorage.getItem(GUEST_SCOPE_KEY);
  if (!stored) return ['austin-tx', 'travis-county-tx', 'texas'];
  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : ['austin-tx', 'travis-county-tx', 'texas'];
  } catch {
    return ['austin-tx', 'travis-county-tx', 'texas'];
  }
}

export function setGuestScope(jurisdictions: string[]): void {
  if (typeof window === 'undefined') return;
  // Limit to 3 jurisdictions
  const limited = jurisdictions.slice(0, 3);
  sessionStorage.setItem(GUEST_SCOPE_KEY, JSON.stringify(limited));
}

export function clearGuestScope(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(GUEST_SCOPE_KEY);
}

export function getGuestTopics(): string[] {
  if (typeof window === 'undefined') return [];
  const stored = sessionStorage.getItem(GUEST_TOPICS_KEY);
  if (!stored) return [];
  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function setGuestTopics(topics: string[]): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(GUEST_TOPICS_KEY, JSON.stringify(topics));
}

export function clearGuestTopics(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(GUEST_TOPICS_KEY);
}
