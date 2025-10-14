import { MeetingFilterOptions, MeetingType } from '@/components/MeetingFilters';
import { startOfDay, endOfDay, startOfWeek, endOfWeek } from 'date-fns';

export const filterMeetings = <T extends {
  starts_at?: string | null;
  body_name?: string | null;
  meeting_type?: string | null;
  is_legislative?: boolean | null;
  status?: string | null;
  agenda_status?: string | null;
  minutes_status?: string | null;
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

    // Date range filter
    if (filters.dateRange?.start || filters.dateRange?.end) {
      if (!meetingDate) return false;
      
      if (filters.dateRange.start && meetingDate < startOfDay(filters.dateRange.start)) {
        return false;
      }
      if (filters.dateRange.end && meetingDate > endOfDay(filters.dateRange.end)) {
        return false;
      }
    }

    // Document status filters
    if (filters.documentStatus) {
      const hasAnyDocFilter = filters.documentStatus.agendaAvailable || 
                              filters.documentStatus.minutesAvailable || 
                              filters.documentStatus.liveNow;
      
      if (hasAnyDocFilter) {
        let matchesDocFilter = false;
        
        if (filters.documentStatus.agendaAvailable && item.agenda_status === 'available') {
          matchesDocFilter = true;
        }
        if (filters.documentStatus.minutesAvailable && 
            (item.minutes_status === 'approved' || item.minutes_status === 'draft')) {
          matchesDocFilter = true;
        }
        if (filters.documentStatus.liveNow && item.status === 'in_progress') {
          matchesDocFilter = true;
        }
        
        if (!matchesDocFilter) {
          return false;
        }
      }
    }

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

    // Meeting type filter
    if (filters.meetingTypes && filters.meetingTypes.length > 0) {
      if (!item.meeting_type || !filters.meetingTypes.includes(item.meeting_type as MeetingType)) {
        return false;
      }
    }

    // Legislative only filter
    if (filters.legislativeOnly && !item.is_legislative) {
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
  meeting_type?: string | null;
  jurisdiction?: {
    name?: string;
  } | null;
}>(items: T[]) => {
  const cities = new Set<string>();
  const bodyNames = new Set<string>();
  const typeCounts: Record<MeetingType, number> = {
    city_council: 0,
    board_of_supervisors: 0,
    committee: 0,
    commission: 0,
    authority: 0
  };

  items.forEach(item => {
    if (item.jurisdiction?.name) cities.add(item.jurisdiction.name);
    if (item.body_name) bodyNames.add(item.body_name);
    if (item.meeting_type && item.meeting_type in typeCounts) {
      typeCounts[item.meeting_type as MeetingType]++;
    }
  });

  return {
    cities: Array.from(cities).sort(),
    bodyNames: Array.from(bodyNames).sort(),
    typeCounts
  };
};
