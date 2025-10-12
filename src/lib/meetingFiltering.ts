import { MeetingFilterOptions } from '@/components/MeetingFilters';
import { startOfDay, endOfDay, startOfWeek, endOfWeek } from 'date-fns';

export const filterMeetings = <T extends {
  starts_at?: string | null;
  body_name?: string | null;
  jurisdiction?: {
    name?: string;
  } | null;
}>(
  items: T[],
  filters: MeetingFilterOptions
): T[] => {
  return items.filter(item => {
    const now = new Date();
    const meetingDate = item.starts_at ? new Date(item.starts_at) : null;

    // Status filter
    if (filters.status && meetingDate) {
      if (filters.status === 'upcoming' && meetingDate < now) {
        return false;
      }
      if (filters.status === 'past' && meetingDate > now) {
        return false;
      }
      if (filters.status === 'today') {
        const dayStart = startOfDay(now);
        const dayEnd = endOfDay(now);
        if (meetingDate < dayStart || meetingDate > dayEnd) {
          return false;
        }
      }
      if (filters.status === 'this-week') {
        const weekStart = startOfWeek(now);
        const weekEnd = endOfWeek(now);
        if (meetingDate < weekStart || meetingDate > weekEnd) {
          return false;
        }
      }
    }

    // City filter
    if (filters.city && item.jurisdiction?.name !== filters.city) {
      return false;
    }

    // Body name filter
    if (filters.bodyName && item.body_name !== filters.bodyName) {
      return false;
    }

    return true;
  });
};

/**
 * Extract unique filter values from meeting data
 */
export const getAvailableMeetingFilters = <T extends {
  body_name?: string | null;
  jurisdiction?: {
    name?: string;
  } | null;
}>(items: T[]) => {
  const cities = new Set<string>();
  const bodyNames = new Set<string>();

  items.forEach(item => {
    if (item.jurisdiction?.name) cities.add(item.jurisdiction.name);
    if (item.body_name) bodyNames.add(item.body_name);
  });

  return {
    cities: Array.from(cities).sort(),
    bodyNames: Array.from(bodyNames).sort()
  };
};
