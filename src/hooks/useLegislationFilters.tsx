import { useState, useEffect } from 'react';
import { FilterOptions, SortOption } from '@/components/LegislationFilters';

const STORAGE_KEY = 'legislation-filters';

const getDefaultFilters = (): FilterOptions => ({
  sortBy: 'introduced_desc',
  author: null,
  district: null,
  city: null,
  status: null
});

export const useLegislationFilters = () => {
  // Initialize from sessionStorage or defaults
  const [filters, setFilters] = useState<FilterOptions>(() => {
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
