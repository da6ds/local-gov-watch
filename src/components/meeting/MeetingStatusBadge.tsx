import { Badge } from "@/components/ui/badge";
import { FileText, Clock, CheckCircle2, Radio } from "lucide-react";

interface MeetingStatusBadgeProps {
  status: string;
  agendaStatus?: string;
  minutesStatus?: string;
  startsAt?: string;
}

export function MeetingStatusBadge({ 
  status, 
  agendaStatus = 'not_published', 
  minutesStatus = 'not_published',
  startsAt 
}: MeetingStatusBadgeProps) {
  // Check if meeting is live (within 3 hours of start time)
  const isLive = () => {
    if (!startsAt || status !== 'in_progress') return false;
    const meetingTime = new Date(startsAt);
    const now = new Date();
    const diffHours = (now.getTime() - meetingTime.getTime()) / (1000 * 60 * 60);
    return diffHours >= 0 && diffHours <= 3;
  };

  // Priority order: Live > Minutes Available > Agenda Available > Upcoming
  if (isLive()) {
    return (
      <Badge variant="destructive" className="flex items-center gap-1 animate-pulse">
        <Radio className="h-3 w-3" />
        Live Now
      </Badge>
    );
  }

  if (minutesStatus === 'approved' || minutesStatus === 'draft') {
    return (
      <Badge className="bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-1">
        <CheckCircle2 className="h-3 w-3" />
        Minutes Available
      </Badge>
    );
  }

  if (agendaStatus === 'available') {
    return (
      <Badge className="bg-green-500 hover:bg-green-600 text-white flex items-center gap-1">
        <FileText className="h-3 w-3" />
        Agenda Available
      </Badge>
    );
  }

  if (status === 'upcoming' && agendaStatus === 'not_published') {
    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        <Clock className="h-3 w-3" />
        Agenda Pending
      </Badge>
    );
  }

  if (status === 'upcoming') {
    return (
      <Badge variant="outline" className="flex items-center gap-1">
        Upcoming
      </Badge>
    );
  }

  return null;
}
