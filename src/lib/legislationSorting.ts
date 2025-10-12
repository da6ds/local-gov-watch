import { SortOption } from '@/components/LegislationFilters';

export const sortLegislation = <T extends {
  introduced_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  title: string;
}>(
  items: T[],
  sortBy: SortOption
): T[] => {
  const sorted = [...items];

  switch (sortBy) {
    case 'introduced_desc':
      return sorted.sort((a, b) => {
        const dateA = new Date(a.introduced_at || a.created_at || 0);
        const dateB = new Date(b.introduced_at || b.created_at || 0);
        return dateB.getTime() - dateA.getTime();
      });

    case 'introduced_asc':
      return sorted.sort((a, b) => {
        const dateA = new Date(a.introduced_at || a.created_at || 0);
        const dateB = new Date(b.introduced_at || b.created_at || 0);
        return dateA.getTime() - dateB.getTime();
      });

    case 'updated_desc':
      return sorted.sort((a, b) => {
        const dateA = new Date(a.updated_at || 0);
        const dateB = new Date(b.updated_at || 0);
        return dateB.getTime() - dateA.getTime();
      });

    case 'title_asc':
      return sorted.sort((a, b) => 
        a.title.localeCompare(b.title, 'en', { sensitivity: 'base' })
      );

    case 'title_desc':
      return sorted.sort((a, b) => 
        b.title.localeCompare(a.title, 'en', { sensitivity: 'base' })
      );

    default:
      return sorted;
  }
};
