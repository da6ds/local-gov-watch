import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getGuestScope, getGuestTopics } from "@/lib/guestSessionStorage";
import { CalendarGrid } from "./CalendarGrid";
import { CalendarAgenda } from "./CalendarAgenda";
import { DayPanel } from "./DayPanel";
import { DaySheet } from "./DaySheet";
import { getCountsByDay, getEventsByDay } from "@/lib/calendarQueries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, List } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

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

interface CalendarProps {
  variant?: 'dashboard' | 'full';
}

export function Calendar({ variant = 'full' }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [mobileView, setMobileView] = useState<'agenda' | 'grid'>('agenda');
  const [sheetOpen, setSheetOpen] = useState(false);
  const isMobile = useIsMobile();

  const scope = getGuestScope().join(',');
  const topics = getGuestTopics();

  // Prefetch event counts for the month
  const { data: counts = {} } = useQuery({
    queryKey: ['calendar-counts', scope, topics, currentMonth],
    queryFn: () => getCountsByDay(scope, topics, currentMonth),
    staleTime: 5 * 60 * 1000,
  });

  // Lazy load events for selected date
  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['calendar-events', scope, topics, selectedDate],
    queryFn: () => selectedDate ? getEventsByDay(selectedDate, scope, topics) : [],
    enabled: !!selectedDate,
    staleTime: 5 * 60 * 1000,
  });

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    if (isMobile && mobileView === 'grid') {
      setSheetOpen(true);
    }
  };

  const handleSheetClose = () => {
    setSheetOpen(false);
  };

  // Fixed heights by breakpoint
  const containerHeight = variant === 'dashboard' 
    ? 'h-[520px] md:h-[560px]' 
    : 'h-[480px] md:h-[600px] lg:h-[640px]';

  // Mobile agenda view
  if (isMobile && mobileView === 'agenda') {
    return (
      <Card className={containerHeight}>
        <CardHeader className="pb-3 flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarIcon className="h-5 w-5" />
            Calendar
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMobileView('grid')}
            className="gap-2"
          >
            <CalendarIcon className="h-4 w-4" />
            Month
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <CalendarAgenda
            currentMonth={currentMonth}
            counts={counts}
            scope={scope}
            topics={topics}
            onDateSelect={handleDateSelect}
            onMonthChange={setCurrentMonth}
          />
        </CardContent>
      </Card>
    );
  }

  // Mobile grid view
  if (isMobile && mobileView === 'grid') {
    return (
      <>
        <Card className={containerHeight}>
          <CardHeader className="pb-3 flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarIcon className="h-5 w-5" />
              Calendar
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMobileView('agenda')}
              className="gap-2"
            >
              <List className="h-4 w-4" />
              Agenda
            </Button>
          </CardHeader>
          <CardContent className="overflow-auto">
            <CalendarGrid
              currentMonth={currentMonth}
              selectedDate={selectedDate}
              counts={counts}
              onDateSelect={handleDateSelect}
              onMonthChange={setCurrentMonth}
              variant="mobile"
            />
          </CardContent>
        </Card>
        <DaySheet
          open={sheetOpen}
          onClose={handleSheetClose}
          date={selectedDate}
          events={events}
          isLoading={eventsLoading}
        />
      </>
    );
  }

  // Tablet: Two-pane split
  if (window.innerWidth >= 768 && window.innerWidth < 1024) {
    return (
      <Card className={containerHeight} data-testid="calendar-card">
        <CardContent className="p-0 h-full flex flex-col">
          <div className="grid md:grid-cols-2 flex-1 min-h-0">
            <div className="p-4 md:p-6 overflow-auto">
              <CalendarGrid
                currentMonth={currentMonth}
                selectedDate={selectedDate}
                counts={counts}
                onDateSelect={handleDateSelect}
                onMonthChange={setCurrentMonth}
                variant="tablet"
              />
            </div>
            <div className="border-l overflow-auto">
              <DayPanel
                date={selectedDate}
                events={events}
                isLoading={eventsLoading}
                scope={scope}
                topics={topics}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Desktop: Grid with hover popover + right panel on click
  return (
    <Card className={containerHeight} data-testid="calendar-card">
      <CardContent className="p-0 h-full flex flex-col">
        <div className="grid lg:grid-cols-2 flex-1 min-h-0">
          <div className="p-4 lg:p-6 overflow-auto">
            <CalendarGrid
              currentMonth={currentMonth}
              selectedDate={selectedDate}
              counts={counts}
              onDateSelect={handleDateSelect}
              onMonthChange={setCurrentMonth}
              variant="desktop"
              enableHoverPopover
              scope={scope}
              topics={topics}
            />
          </div>
          <div className="border-l overflow-auto">
            <DayPanel
              date={selectedDate}
              events={events}
              isLoading={eventsLoading}
              scope={scope}
              topics={topics}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
