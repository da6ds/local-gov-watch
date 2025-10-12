import { FilterOptions } from '@/components/LegislationFilters';

export const filterLegislation = <T extends {
  author?: string | null;
  district_number?: number | null;
  city?: string | null;
  status?: string | null;
}>(
  items: T[],
  filters: FilterOptions
): T[] => {
  return items.filter(item => {
    // Author filter
    if (filters.author && item.author !== filters.author) {
      return false;
    }

    // District filter
    if (filters.district !== null && item.district_number !== filters.district) {
      return false;
    }

    // City filter
    if (filters.city && item.city !== filters.city) {
      return false;
    }

    // Status filter
    if (filters.status && item.status !== filters.status) {
      return false;
    }

    return true;
  });
};

/**
 * Extract unique filter values from legislation data
 */
export const getAvailableFilters = <T extends {
  author?: string | null;
  district_number?: number | null;
  city?: string | null;
  status?: string | null;
}>(items: T[]) => {
  const authors = new Set<string>();
  const districts = new Set<number>();
  const cities = new Set<string>();
  const statuses = new Set<string>();

  items.forEach(item => {
    if (item.author) authors.add(item.author);
    if (item.district_number !== null && item.district_number !== undefined) {
      districts.add(item.district_number);
    }
    if (item.city) cities.add(item.city);
    if (item.status) statuses.add(item.status);
  });

  return {
    authors: Array.from(authors).sort(),
    districts: Array.from(districts).sort((a, b) => a - b),
    cities: Array.from(cities).sort(),
    statuses: Array.from(statuses).sort()
  };
};
