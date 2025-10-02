import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, startOfMonth, endOfMonth, addMonths, parseISO } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

interface MiniCalendarProps {
  scope: string; // e.g., "austin-tx,travis-county-tx,texas"
}

interface CalendarEvent {
  id: string;
  kind: 'meeting' | 'election';
  title: string;
  start: string;
  jurisdiction: string;
}

export function MiniCalendar({ scope }: MiniCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const navigate = useNavigate();

  const startDate = startOfMonth(new Date());
  const endDate = endOfMonth(addMonths(new Date(), 1));

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['mini-calendar-events', scope, startDate, endDate],
    queryFn: async (): Promise<CalendarEvent[]> => {
      const url = new URL(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/calendar-api`);
      url.searchParams.set('start', startDate.toISOString());
      url.searchParams.set('end', endDate.toISOString());
      url.searchParams.set('scope', scope);
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
    enabled: !!scope,
    staleTime: 5 * 60 * 1000 // 5 minutes
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

  const handleEventClick = (event: CalendarEvent) => {
    if (event.kind === 'meeting') {
      navigate(`/meetings/${event.id}`);
    } else {
      navigate(`/elections/${event.id}`);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[320px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calendar</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          modifiers={{
            hasEvent: datesWithEvents
          }}
          modifiersClassNames={{
            hasEvent: "bg-primary/10 font-bold"
          }}
          className="rounded-md border"
        />
        
        {eventsOnDate.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">
              {format(selectedDate!, 'MMMM d, yyyy')}
            </p>
            <div className="space-y-2">
              {eventsOnDate.map((event) => (
                <div
                  key={event.id}
                  onClick={() => handleEventClick(event)}
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-muted cursor-pointer transition-colors"
                >
                  <Badge variant={event.kind === 'meeting' ? 'default' : 'secondary'}>
                    {event.kind}
                  </Badge>
                  <span className="text-sm truncate flex-1">{event.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {eventsOnDate.length === 0 && selectedDate && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No events on this day
          </p>
        )}
      </CardContent>
    </Card>
  );
}
