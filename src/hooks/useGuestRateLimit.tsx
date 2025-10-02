import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

interface RateLimitState {
  count: number;
  resetAt: number;
}

const RATE_LIMIT_MAX = 20; // 20 requests
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds
const STORAGE_KEY = 'guest_rate_limit';

export function useGuestRateLimit() {
  const { isGuest } = useAuth();
  const [rateLimitState, setRateLimitState] = useState<RateLimitState>(() => {
    if (typeof window === 'undefined') return { count: 0, resetAt: Date.now() + RATE_LIMIT_WINDOW };
    
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Reset if window has passed
      if (parsed.resetAt < Date.now()) {
        return { count: 0, resetAt: Date.now() + RATE_LIMIT_WINDOW };
      }
      return parsed;
    }
    return { count: 0, resetAt: Date.now() + RATE_LIMIT_WINDOW };
  });

  // Reset counter when window expires
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      if (rateLimitState.resetAt < now) {
        const newState = { count: 0, resetAt: now + RATE_LIMIT_WINDOW };
        setRateLimitState(newState);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [rateLimitState.resetAt]);

  const checkRateLimit = (): { allowed: boolean; remaining: number; resetIn: number } => {
    // All users are guests now, apply rate limit

    const now = Date.now();
    
    // Reset if window has passed
    if (rateLimitState.resetAt < now) {
      const newState = { count: 0, resetAt: now + RATE_LIMIT_WINDOW };
      setRateLimitState(newState);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetIn: RATE_LIMIT_WINDOW };
    }

    const allowed = rateLimitState.count < RATE_LIMIT_MAX;
    const remaining = Math.max(0, RATE_LIMIT_MAX - rateLimitState.count - 1);
    const resetIn = rateLimitState.resetAt - now;

    return { allowed, remaining, resetIn };
  };

  const incrementRateLimit = () => {
    // All users are guests now, apply rate limit

    const now = Date.now();
    
    // Reset if window has passed
    if (rateLimitState.resetAt < now) {
      const newState = { count: 1, resetAt: now + RATE_LIMIT_WINDOW };
      setRateLimitState(newState);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      return;
    }

    const newState = { 
      count: rateLimitState.count + 1, 
      resetAt: rateLimitState.resetAt 
    };
    setRateLimitState(newState);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
  };

  return {
    checkRateLimit,
    incrementRateLimit,
    isRateLimited: rateLimitState.count >= RATE_LIMIT_MAX && rateLimitState.resetAt > Date.now(),
    remaining: Math.max(0, RATE_LIMIT_MAX - rateLimitState.count),
    resetIn: Math.max(0, rateLimitState.resetAt - Date.now())
  };
}
