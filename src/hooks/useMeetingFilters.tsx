import { useState, useEffect } from 'react';
import { MeetingFilterOptions } from '@/components/MeetingFilters';

const STORAGE_KEY = 'meeting-filters';

const getDefaultFilters = (): MeetingFilterOptions => ({
  sortBy: 'date_desc',
  status: null,
  city: null,
  bodyName: null
});

export const useMeetingFilters = () => {
  // Initialize from sessionStorage or defaults
  const [filters, setFilters] = useState<MeetingFilterOptions>(() => {
    if (typeof window === 'undefined') return getDefaultFilters();
    
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return getDefaultFilters();
      }
    }
    return getDefaultFilters();
  });

  // Persist to sessionStorage when filters change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
    }
  }, [filters]);

  return {
    filters,
    setFilters,
    clearFilters: () => setFilters(getDefaultFilters())
  };
};
