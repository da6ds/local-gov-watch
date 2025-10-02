import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock } from "lucide-react";
import { differenceInDays, isToday, format } from "date-fns";

interface MeetingStatusProps {
  startsAt: string;
}

export function MeetingStatus({ startsAt }: MeetingStatusProps) {
  const meetingDate = new Date(startsAt);
  const now = new Date();
  const daysDiff = differenceInDays(meetingDate, now);
  const isPast = meetingDate < now;
  const isTodaysMeeting = isToday(meetingDate);

  const getStatusInfo = () => {
    if (isTodaysMeeting) {
      return {
        label: "Today",
        description: `at ${format(meetingDate, "p")}`,
        variant: "default" as const,
        className: "bg-yellow-500 text-white hover:bg-yellow-600",
      };
    }
    
    if (isPast) {
      return {
        label: "Past Meeting",
        description: `Held ${Math.abs(daysDiff)} ${Math.abs(daysDiff) === 1 ? 'day' : 'days'} ago`,
        variant: "secondary" as const,
        className: "",
      };
    }
    
    return {
      label: "Upcoming",
      description: `in ${daysDiff} ${daysDiff === 1 ? 'day' : 'days'}`,
      variant: "default" as const,
      className: "bg-green-600 text-white hover:bg-green-700",
    };
  };

  const status = getStatusInfo();

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Status</span>
            <Badge variant={status.variant} className={status.className}>
              {status.label}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {isTodaysMeeting ? (
              <Clock className="h-4 w-4" />
            ) : (
              <Calendar className="h-4 w-4" />
            )}
            <span>{status.description}</span>
          </div>
          
          <div className="pt-2 border-t text-xs text-muted-foreground">
            {format(meetingDate, "PPPP 'at' p")}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
