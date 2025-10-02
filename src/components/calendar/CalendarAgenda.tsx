import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  parseISO,
  addMonths,
  subMonths,
  isSameDay,
} from "date-fns";
import { getEventsByDay } from "@/lib/calendarQueries";
import { useNavigate } from "react-router-dom";
import { CalendarEvent } from "./Calendar";

interface CalendarAgendaProps {
  currentMonth: Date;
  counts: Record<string, number>;
  scope: string;
  topics: string[];
  onDateSelect: (date: Date) => void;
  onMonthChange: (date: Date) => void;
}

export function CalendarAgenda({
  currentMonth,
  counts,
  scope,
  topics,
  onDateSelect,
  onMonthChange,
}: CalendarAgendaProps) {
  const navigate = useNavigate();

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get only days with events
  const daysWithEvents = daysInMonth.filter(day => {
    const key = format(day, 'yyyy-MM-dd');
    return counts[key] && counts[key] > 0;
  });

  const handlePrevMonth = () => onMonthChange(subMonths(currentMonth, 1));
  const handleNextMonth = () => onMonthChange(addMonths(currentMonth, 1));

  const handleEventClick = (event: CalendarEvent) => {
    if (event.kind === 'meeting') {
      navigate(`/meetings/${event.id}`);
    } else {
      navigate(`/elections/${event.id}`);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Sticky month header */}
      <div className="sticky top-0 bg-background z-10 border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">
            {format(currentMonth, 'MMMM yyyy')}
          </h3>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Scrollable agenda list */}
      <div className="flex-1 overflow-auto">
        {daysWithEvents.length === 0 ? (
          <div className="flex items-center justify-center h-full p-8">
            <p className="text-sm text-muted-foreground text-center">
              No events this month
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {daysWithEvents.map((day) => (
              <AgendaDay
                key={format(day, 'yyyy-MM-dd')}
                date={day}
                eventCount={counts[format(day, 'yyyy-MM-dd')] || 0}
                scope={scope}
                topics={topics}
                onDateSelect={onDateSelect}
                onEventClick={handleEventClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface AgendaDayProps {
  date: Date;
  eventCount: number;
  scope: string;
  topics: string[];
  onDateSelect: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
}

function AgendaDay({ date, eventCount, scope, topics, onDateSelect, onEventClick }: AgendaDayProps) {
  const [expanded, setExpanded] = React.useState(false);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['agenda-day', scope, topics, date],
    queryFn: () => getEventsByDay(date, scope, topics),
    enabled: expanded,
    staleTime: 5 * 60 * 1000,
  });

  const previewLimit = 3;
  const hasMore = eventCount > previewLimit;

  return (
    <div className="p-4">
      {/* Day header */}
      <div
        className="flex items-center justify-between mb-3 cursor-pointer"
        onClick={() => {
          setExpanded(!expanded);
          onDateSelect(date);
        }}
      >
        <div>
          <h4 className="font-semibold text-sm">
            {format(date, 'EEE, MMM d')}
          </h4>
          <p className="text-xs text-muted-foreground">
            {eventCount} event{eventCount !== 1 ? 's' : ''}
          </p>
        </div>
        <Button variant="ghost" size="sm">
          {expanded ? 'Collapse' : 'Expand'}
        </Button>
      </div>

      {/* Event preview/list */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map(i => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : expanded ? (
        <div className="space-y-2">
          {events.map((event) => (
            <div
              key={event.id}
              onClick={() => onEventClick(event)}
              className="flex flex-col gap-2 p-3 rounded-md bg-muted/50 hover:bg-muted cursor-pointer transition-colors border"
            >
              <div className="flex items-center gap-2">
                <Badge variant={event.kind === 'meeting' ? 'default' : 'secondary'} className="text-xs">
                  {event.kind}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {format(parseISO(event.start), 'h:mm a')}
                </span>
              </div>
              <span className="text-sm font-medium line-clamp-2">{event.title}</span>
              <span className="text-xs text-muted-foreground">{event.jurisdiction}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

// Need to import React for useState
import * as React from "react";
