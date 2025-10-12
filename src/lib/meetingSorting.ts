import { MeetingSortOption } from '@/components/MeetingFilters';

export const sortMeetings = <T extends {
  starts_at?: string | null;
  created_at?: string | null;
  title: string;
}>(
  items: T[],
  sortBy: MeetingSortOption
): T[] => {
  const sorted = [...items];

  switch (sortBy) {
    case 'date_desc':
      // Soonest first (upcoming meetings at top)
      return sorted.sort((a, b) => {
        const dateA = new Date(a.starts_at || a.created_at || 0);
        const dateB = new Date(b.starts_at || b.created_at || 0);
        return dateA.getTime() - dateB.getTime();
      });

    case 'date_asc':
      // Latest first (most recent past meetings at top)
      return sorted.sort((a, b) => {
        const dateA = new Date(a.starts_at || a.created_at || 0);
        const dateB = new Date(b.starts_at || b.created_at || 0);
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
