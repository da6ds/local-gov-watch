import { useState, useEffect, useMemo } from 'react';
import { getAllTrackedTerms, TrackedTerm } from '@/lib/trackedTermStorage';

const ACTIVE_FILTERS_KEY = 'tracked-terms-active-filters';

export const useTrackedTermsFilter = () => {
  const [activeFilterIds, setActiveFilterIds] = useState<string[]>(() => {
    const stored = sessionStorage.getItem(ACTIVE_FILTERS_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return [];
      }
    }
    return [];
  });

  // Get all tracked terms
  const allTerms = useMemo(() => {
    return getAllTrackedTerms();
  }, []);

  // Persist active filters to sessionStorage
  useEffect(() => {
    sessionStorage.setItem(ACTIVE_FILTERS_KEY, JSON.stringify(activeFilterIds));
  }, [activeFilterIds]);

  // Get active terms with their details
  const activeTerms = useMemo(() => {
    return allTerms.filter(term => activeFilterIds.includes(term.id));
  }, [allTerms, activeFilterIds]);

  // Get all keywords from active terms
  const activeKeywords = useMemo(() => {
    return activeTerms.flatMap(term => term.keywords);
  }, [activeTerms]);

  const toggleFilter = (termId: string) => {
    setActiveFilterIds(prev => 
      prev.includes(termId)
        ? prev.filter(id => id !== termId)
        : [...prev, termId]
    );
  };

  const clearFilters = () => {
    setActiveFilterIds([]);
  };

  const hasActiveFilters = activeFilterIds.length > 0;

  return {
    allTerms,
    activeFilterIds,
    activeTerms,
    activeKeywords,
    toggleFilter,
    clearFilters,
    hasActiveFilters
  };
};
