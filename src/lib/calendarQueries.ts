import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";

export interface CalendarEvent {
  id: string;
  kind: 'meeting' | 'election';
  title: string;
  start: string;
  end?: string;
  jurisdiction: string;
  jurisdictionId: number;
  location?: string;
}

/**
 * Fetch event counts per day for a given month
 */
export async function getCountsByDay(
  scope: string,
  topics: string[],
  month: Date
): Promise<Record<string, number>> {
  const startDate = startOfMonth(month);
  const endDate = endOfMonth(month);

  const url = new URL(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/calendar-api`);
  url.searchParams.set('start', startDate.toISOString());
  url.searchParams.set('end', endDate.toISOString());
  url.searchParams.set('scope', scope);
  url.searchParams.set('kinds', 'meetings,elections');
  if (topics && topics.length > 0) {
    url.searchParams.set('topics', topics.join(','));
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || ''
    }
  });

  if (!response.ok) {
    console.error('Failed to fetch calendar counts');
    return {};
  }

  const events: CalendarEvent[] = await response.json();

  // Count events per day
  const counts: Record<string, number> = {};
  events.forEach(event => {
    const dateKey = format(parseISO(event.start), 'yyyy-MM-dd');
    counts[dateKey] = (counts[dateKey] || 0) + 1;
  });

  return counts;
}

/**
 * Fetch events for a specific day
 */
export async function getEventsByDay(
  date: Date,
  scope: string,
  topics: string[],
  limit?: number
): Promise<CalendarEvent[]> {
  const dateStr = format(date, 'yyyy-MM-dd');
  
  const url = new URL(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/calendar-api`);
  url.searchParams.set('start', `${dateStr}T00:00:00Z`);
  url.searchParams.set('end', `${dateStr}T23:59:59Z`);
  url.searchParams.set('scope', scope);
  url.searchParams.set('kinds', 'meetings,elections');
  if (topics && topics.length > 0) {
    url.searchParams.set('topics', topics.join(','));
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || ''
    }
  });

  if (!response.ok) {
    console.error('Failed to fetch events for day');
    return [];
  }

  const events: CalendarEvent[] = await response.json();
  
  // Sort by start time
  events.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  return limit ? events.slice(0, limit) : events;
}
