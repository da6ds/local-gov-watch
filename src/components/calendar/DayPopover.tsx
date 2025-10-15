import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { getEventsByDay } from "@/lib/calendarQueries";
import { Calendar, ArrowRight, MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";

interface DayPopoverProps {
  date: Date;
  eventCount: number;
  scope: string;
  topics?: string[];
  children: React.ReactNode;
}

export function DayPopover({ date, eventCount, scope, topics, children }: DayPopoverProps) {
  const [open, setOpen] = useState(false);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['day-popover', scope, topics, date],
    queryFn: () => getEventsByDay(date, scope, topics, 2), // Only fetch top 2 for preview
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <HoverCard open={open} onOpenChange={setOpen} openDelay={300}>
      <HoverCardTrigger asChild>
        {children}
      </HoverCardTrigger>
      <HoverCardContent 
        side="top" 
        align="center" 
        className="w-80"
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-semibold">
                {format(date, 'EEE, MMM d')}
              </h4>
            </div>
            <Badge variant="secondary" className="text-xs">
              {eventCount} event{eventCount !== 1 ? 's' : ''}
            </Badge>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {events.slice(0, 2).map((event) => (
                  <Link
                    key={event.id}
                    to={event.kind === 'meeting' ? `/meeting/${event.id}` : `/election/${event.id}`}
                    className="flex flex-col gap-1 p-2 rounded-md bg-muted/50 border hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={event.kind === 'meeting' ? 'default' : 'secondary'} 
                        className="text-xs"
                      >
                        {event.kind}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(event.start), 'h:mm a')}
                      </span>
                    </div>
                    <span className="text-sm line-clamp-1 font-medium">{event.title}</span>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span className="line-clamp-1">{event.jurisdiction}</span>
                    </div>
                  </Link>
                ))}
              </div>

              {eventCount > 2 && (
                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground pt-1 border-t">
                  <span>+{eventCount - 2} more event{eventCount - 2 !== 1 ? 's' : ''}</span>
                  <ArrowRight className="h-3 w-3" />
                </div>
              )}
            </>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
