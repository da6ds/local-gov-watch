// Local storage utilities for stance management (temporary until auth is implemented)

export type StanceType = 'support' | 'oppose' | 'watching' | 'unimportant' | null;

interface StanceData {
  legislationId: string;
  legislationTitle: string;
  stance: StanceType;
  timestamp: string;
}

const STANCE_PREFIX = 'stance_';

export function setStance(legislationId: string, legislationTitle: string, stance: StanceType): void {
  if (typeof window === 'undefined') return;
  
  const key = `${STANCE_PREFIX}${legislationId}`;
  
  if (stance === null) {
    sessionStorage.removeItem(key);
    return;
  }
  
  const data: StanceData = {
    legislationId,
    legislationTitle,
    stance,
    timestamp: new Date().toISOString()
  };
  
  sessionStorage.setItem(key, JSON.stringify(data));
}

export function getStance(legislationId: string): StanceType {
  if (typeof window === 'undefined') return null;
  
  const key = `${STANCE_PREFIX}${legislationId}`;
  const stored = sessionStorage.getItem(key);
  
  if (!stored) return null;
  
  try {
    const data: StanceData = JSON.parse(stored);
    return data.stance;
  } catch {
    return null;
  }
}

export function getAllStances(): StanceData[] {
  if (typeof window === 'undefined') return [];
  
  const stances: StanceData[] = [];
  
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key?.startsWith(STANCE_PREFIX)) {
      const stored = sessionStorage.getItem(key);
      if (stored) {
        try {
          const data: StanceData = JSON.parse(stored);
          stances.push(data);
        } catch {
          // Skip invalid entries
        }
      }
    }
  }
  
  // Sort by timestamp, newest first
  return stances.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}
