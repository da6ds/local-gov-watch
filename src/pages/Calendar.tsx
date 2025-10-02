import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { CalendarCard } from "@/components/CalendarCard";
import { EventsCard } from "@/components/EventsCard";
import { getGuestScope } from "@/lib/guestSessionStorage";
import { startOfMonth, endOfMonth, addMonths, parseISO, format } from "date-fns";

interface CalendarEvent {
  id: string;
  kind: 'meeting' | 'election';
  title: string;
  start: string;
  end?: string;
  jurisdiction: string;
  location?: string;
}

export default function Calendar() {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const scopeString = getGuestScope().join(',');

  const startDate = startOfMonth(currentMonth);
  const endDate = endOfMonth(addMonths(currentMonth, 1));

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['calendar-events', scopeString, startDate, endDate],
    queryFn: async (): Promise<CalendarEvent[]> => {
      const url = new URL(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/calendar-api`);
      url.searchParams.set('start', startDate.toISOString());
      url.searchParams.set('end', endDate.toISOString());
      url.searchParams.set('scope', scopeString);
      url.searchParams.set('kinds', 'meetings,elections');

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || ''
        }
      });

      if (!response.ok) {
        console.error('Failed to fetch calendar events');
        return [];
      }

      return await response.json();
    },
    enabled: !!scopeString,
    staleTime: 5 * 60 * 1000
  });

  // Get events for selected date
  const eventsOnDate = selectedDate
    ? events.filter(event => {
        const eventDate = parseISO(event.start);
        return format(eventDate, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
      })
    : [];

  // Dates that have events
  const datesWithEvents = events.map(event => parseISO(event.start));

  return (
    <Layout>
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        {/* Header - visible on mobile only */}
        <div className="md:hidden mb-6">
          <h1 className="text-3xl font-bold mb-2">Calendar</h1>
          <p className="text-muted-foreground">View upcoming meetings and elections</p>
        </div>

        {/* Two-column grid */}
        <div className="grid gap-6 md:grid-cols-2">
          <CalendarCard
            currentMonth={currentMonth}
            selectedDate={selectedDate}
            datesWithEvents={datesWithEvents}
            onDateSelect={setSelectedDate}
            onMonthChange={setCurrentMonth}
          />
          <EventsCard
            selectedDate={selectedDate}
            events={eventsOnDate}
            isLoading={isLoading}
          />
        </div>
      </div>
    </Layout>
  );
}
