import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Calendar, MapPin, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CalendarEvent } from "./Calendar";
import { clearGuestTopics } from "@/lib/guestSessionStorage";

interface DayPanelProps {
  date: Date | undefined;
  events: CalendarEvent[];
  isLoading: boolean;
  scope: string;
  topics?: string[];
}

export function DayPanel({ date, events, isLoading, scope, topics }: DayPanelProps) {
  const navigate = useNavigate();

  const handleEventClick = (event: CalendarEvent) => {
    if (event.kind === 'meeting') {
      navigate(`/meetings/${event.id}`);
    } else {
      navigate(`/elections/${event.id}`);
    }
  };

  const handleClearTopics = () => {
    clearGuestTopics();
    window.location.reload();
  };

  // Group events by jurisdiction
  const groupedEvents = events.reduce((acc, event) => {
    const key = event.jurisdiction;
    if (!acc[key]) acc[key] = [];
    acc[key].push(event);
    return acc;
  }, {} as Record<string, CalendarEvent[]>);

  return (
    <div className="p-4 md:p-6 h-full flex flex-col" data-testid="events-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          <h3 className="font-semibold">Events</h3>
        </div>
        {date && (
          <span className="text-sm text-muted-foreground">
            {format(date, 'EEE, MMM d, yyyy')}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {!date ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-muted-foreground text-center">
              Select a date to see events
            </p>
          </div>
        ) : isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-3 border rounded-md space-y-2">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-32" />
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <p className="text-sm text-muted-foreground text-center">
              {topics && topics.length > 0 
                ? "No events for your filters" 
                : "No events on this day"}
            </p>
            {topics && topics.length > 0 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleClearTopics}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Clear topics
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedEvents).map(([jurisdiction, jurisdictionEvents]) => (
              <div key={jurisdiction} className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {jurisdiction}
                </h4>
                <div className="space-y-2">
                  {jurisdictionEvents.map((event) => (
                    <div
                      key={event.id}
                      data-testid="event-row"
                      onClick={() => handleEventClick(event)}
                      className="flex flex-col gap-2 p-3 rounded-md hover:bg-accent cursor-pointer transition-colors border group"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleEventClick(event);
                        }
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant={event.kind === 'meeting' ? 'default' : 'secondary'}>
                          {event.kind}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(event.start), 'h:mm a')}
                        </span>
                      </div>
                      <span className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
                        {event.title}
                      </span>
                      {event.location && (
                        <div className="flex items-start gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-1">{event.location}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
