import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Calendar, MapPin } from "lucide-react";

interface CalendarEvent {
  id: string;
  kind: 'meeting' | 'election';
  title: string;
  start: string;
  end?: string;
  jurisdiction: string;
  location?: string;
}

interface EventsCardProps {
  selectedDate: Date | undefined;
  events: CalendarEvent[];
  isLoading: boolean;
}

export function EventsCard({ selectedDate, events, isLoading }: EventsCardProps) {
  const navigate = useNavigate();

  const handleEventClick = (event: CalendarEvent) => {
    if (event.kind === 'meeting') {
      navigate(`/meetings/${event.id}`);
    } else {
      navigate(`/elections/${event.id}`);
    }
  };

  return (
    <Card data-testid="events-card" className="h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="h-5 w-5" />
          Events
          {selectedDate && (
            <span className="text-sm font-normal text-muted-foreground ml-auto">
              {format(selectedDate, 'EEE, MMM d, yyyy')}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!selectedDate ? (
          <p className="text-sm text-muted-foreground text-center py-12">
            Select a date to see events
          </p>
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
          <p className="text-sm text-muted-foreground text-center py-12">
            No events on this day
          </p>
        ) : (
          <div className="space-y-2 max-h-[60vh] overflow-auto">
            {events.map((event) => (
              <div
                key={event.id}
                data-testid="event-row"
                onClick={() => handleEventClick(event)}
                className="flex flex-col gap-2 p-3 rounded-md hover:bg-accent cursor-pointer transition-colors border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleEventClick(event);
                  }
                }}
              >
                <div className="flex items-center gap-2">
                  <Badge variant={event.kind === 'meeting' ? 'default' : 'secondary'} className="w-fit">
                    {event.kind}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(event.start), 'h:mm a')}
                  </span>
                </div>
                <span className="text-sm font-medium line-clamp-2">{event.title}</span>
                <div className="flex items-start gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-1">
                    {event.location || event.jurisdiction}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
