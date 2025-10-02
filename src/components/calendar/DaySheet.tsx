import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { MapPin, Calendar as CalendarIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CalendarEvent } from "./Calendar";

interface DaySheetProps {
  open: boolean;
  onClose: () => void;
  date: Date | undefined;
  events: CalendarEvent[];
  isLoading: boolean;
}

export function DaySheet({ open, onClose, date, events, isLoading }: DaySheetProps) {
  const navigate = useNavigate();

  const handleEventClick = (event: CalendarEvent) => {
    if (event.kind === 'meeting') {
      navigate(`/meetings/${event.id}`);
    } else {
      navigate(`/elections/${event.id}`);
    }
    onClose();
  };

  const handleOpenFullCalendar = () => {
    navigate('/calendar');
    onClose();
  };

  // Group events by jurisdiction
  const groupedEvents = events.reduce((acc, event) => {
    const key = event.jurisdiction;
    if (!acc[key]) acc[key] = [];
    acc[key].push(event);
    return acc;
  }, {} as Record<string, CalendarEvent[]>);

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent 
        side="bottom" 
        className="h-[85vh] rounded-t-xl"
        aria-modal="true"
      >
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              {date ? format(date, 'EEEE, MMMM d, yyyy') : 'Events'}
            </SheetTitle>
            <Button
              variant="link"
              size="sm"
              onClick={handleOpenFullCalendar}
              className="text-primary"
            >
              Open full calendar
            </Button>
          </div>
        </SheetHeader>

        <div className="overflow-auto h-[calc(100%-80px)] pb-6">
          {isLoading ? (
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
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-muted-foreground text-center">
                No events on this day
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedEvents).map(([jurisdiction, jurisdictionEvents]) => (
                <div key={jurisdiction} className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide sticky top-0 bg-background py-2">
                    {jurisdiction}
                  </h4>
                  <div className="space-y-2">
                    {jurisdictionEvents.map((event) => (
                      <div
                        key={event.id}
                        onClick={() => handleEventClick(event)}
                        className="flex flex-col gap-2 p-4 rounded-md hover:bg-accent cursor-pointer transition-colors border group touch-target"
                        role="button"
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
                        <span className="text-base font-medium line-clamp-2 group-hover:text-primary transition-colors">
                          {event.title}
                        </span>
                        {event.location && (
                          <div className="flex items-start gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
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
      </SheetContent>
    </Sheet>
  );
}
