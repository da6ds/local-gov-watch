import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, AlertCircle } from "lucide-react";
import { formatMeetingDateTime, calculateMeetingStatus, getMeetingStatusVariant, getMeetingStatusLabel } from "@/lib/meetingUtils";

interface MeetingStatusProps {
  startsAt: string;
  endsAt?: string | null;
  status?: string;
}

export function MeetingStatus({ startsAt, endsAt, status }: MeetingStatusProps) {
  const calculatedStatus = (status as any) || calculateMeetingStatus(startsAt, endsAt);
  const dateTime = formatMeetingDateTime(startsAt, endsAt, calculatedStatus);
  const statusVariant = getMeetingStatusVariant(calculatedStatus);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          <span>Meeting Status</span>
          <Badge variant={statusVariant}>
            {getMeetingStatusLabel(calculatedStatus)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {dateTime.isSoon && calculatedStatus === 'upcoming' && (
          <div className="flex items-start gap-2 p-2 bg-destructive/10 rounded-md">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
            <div className="text-sm">
              <span className="font-medium text-destructive">Starting soon!</span>
              <div className="text-muted-foreground">{dateTime.relative}</div>
            </div>
          </div>
        )}
        
        {calculatedStatus === 'in_progress' && (
          <div className="flex items-start gap-2 p-2 bg-destructive/10 rounded-md">
            <Clock className="h-4 w-4 text-destructive mt-0.5 animate-pulse" />
            <div className="text-sm">
              <span className="font-medium text-destructive">Meeting in progress</span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div className="text-sm">
            {dateTime.relative && <div className="font-medium">{dateTime.relative}</div>}
          </div>
        </div>

        <div className="text-xs text-muted-foreground pt-2 border-t space-y-1">
          <div>{dateTime.date}</div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {dateTime.time}
            {dateTime.endTime && <span> - {dateTime.endTime}</span>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
