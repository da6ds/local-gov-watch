import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, List, Download } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface CalendarEvent {
  id: string;
  kind: 'meeting' | 'election';
  title: string;
  start: string;
  end: string | null;
  allDay: boolean;
  location: string | null;
  bodyName: string | null;
  jurisdiction: string;
  detailUrl: string;
}

interface CalendarViewProps {
  events: CalendarEvent[];
  onExportICS: () => void;
  isLoading?: boolean;
}

export function CalendarView({ events, onExportICS, isLoading }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'agenda'>(() => {
    const saved = localStorage.getItem('calendar_view');
    if (saved === 'agenda') return 'agenda';
    return 'month';
  });
  const navigate = useNavigate();

  const handleViewChange = (newView: 'month' | 'agenda') => {
    setView(newView);
    localStorage.setItem('calendar_view', newView);
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach(event => {
      const dateKey = format(parseISO(event.start), 'yyyy-MM-dd');
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(event);
    });
    return map;
  }, [events]);

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const handleToday = () => setCurrentDate(new Date());

  const handleEventClick = (event: CalendarEvent) => {
    navigate(event.detailUrl);
  };

  if (view === 'agenda') {
    const sortedEvents = [...events].sort((a, b) => 
      new Date(a.start).getTime() - new Date(b.start).getTime()
    );

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handleViewChange('month')}>
              <CalendarIcon className="h-4 w-4 mr-2" />
              Month
            </Button>
            <Button variant="default" size="sm" onClick={() => handleViewChange('agenda')}>
              <List className="h-4 w-4 mr-2" />
              Agenda
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={onExportICS} disabled={isLoading || events.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export ICS
          </Button>
        </div>

        {sortedEvents.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="max-w-md mx-auto space-y-4">
              <p className="text-muted-foreground">No events match your current filters</p>
              <div className="flex gap-2 justify-center flex-wrap">
                <Button variant="outline" size="sm" onClick={handleNextMonth}>
                  Next Month
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleViewChange('month')}>
                  Month View
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">Try expanding your filters or date range</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {sortedEvents.map(event => (
              <Card 
                key={event.id}
                className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleEventClick(event)}
              >
                <div className="flex items-start gap-4">
                  <div className="text-center min-w-[60px]">
                    <div className="text-2xl font-bold">{format(parseISO(event.start), 'd')}</div>
                    <div className="text-xs text-muted-foreground uppercase">{format(parseISO(event.start), 'MMM')}</div>
                    {!event.allDay && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {format(parseISO(event.start), 'h:mm a')}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={event.kind === 'meeting' ? 'default' : 'secondary'}>
                        {event.kind === 'meeting' ? 'Meeting' : 'Election'}
                      </Badge>
                      {event.bodyName && (
                        <span className="text-xs text-muted-foreground">{event.bodyName}</span>
                      )}
                    </div>
                    <h3 className="font-medium mb-1">{event.title}</h3>
                    {event.location && (
                      <p className="text-sm text-muted-foreground">{event.location}</p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleToday}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold ml-2">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="default" size="sm" onClick={() => handleViewChange('month')}>
            <CalendarIcon className="h-4 w-4 mr-2" />
            Month
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleViewChange('agenda')}>
            <List className="h-4 w-4 mr-2" />
            Agenda
          </Button>
          <Button variant="outline" size="sm" onClick={onExportICS} disabled={isLoading || events.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export ICS
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="bg-card p-2 text-center text-sm font-medium text-muted-foreground">
              {day}
            </div>
          ))}
          {calendarDays.map((day, idx) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayEvents = eventsByDate.get(dateKey) || [];
            const isToday = isSameDay(day, new Date());
            const isCurrentMonth = isSameMonth(day, currentDate);

            return (
              <div
                key={idx}
                className={cn(
                  "bg-card min-h-[100px] p-2 relative",
                  !isCurrentMonth && "text-muted-foreground opacity-50"
                )}
              >
                <div className={cn(
                  "text-sm font-medium mb-1",
                  isToday && "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center"
                )}>
                  {format(day, 'd')}
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map(event => (
                    <div
                      key={event.id}
                      onClick={() => handleEventClick(event)}
                      className={cn(
                        "text-xs p-1 rounded cursor-pointer hover:opacity-80 transition-opacity truncate",
                        event.kind === 'meeting' ? "bg-primary/20 text-primary" : "bg-secondary text-secondary-foreground"
                      )}
                      title={event.title}
                    >
                      {!event.allDay && format(parseISO(event.start), 'h:mm a') + ' '}
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-muted-foreground px-1">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {events.length === 0 && !isLoading && (
        <Card className="p-12 text-center">
          <div className="max-w-md mx-auto space-y-4">
            <p className="text-muted-foreground">No events in this time range</p>
            <div className="flex gap-2 justify-center flex-wrap">
              <Button variant="outline" size="sm" onClick={handleNextMonth}>
                Next Month
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleViewChange('agenda')}>
                Agenda View
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">Try expanding your filters or selecting a different date range</p>
          </div>
        </Card>
      )}
    </div>
  );
}
