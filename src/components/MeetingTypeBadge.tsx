import { Gavel, Clipboard } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface MeetingTypeBadgeProps {
  meetingType: string;
  isLegislative: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  city_council: 'City Council',
  board_of_supervisors: 'Board of Supervisors',
  committee: 'Committee',
  commission: 'Commission',
  authority: 'Authority'
};

export function MeetingTypeBadge({ meetingType, isLegislative }: MeetingTypeBadgeProps) {
  if (!meetingType) return null;

  const label = TYPE_LABELS[meetingType] || meetingType;

  if (isLegislative) {
    return (
      <Badge variant="default" className="gap-1 font-semibold bg-amber-500/10 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 hover:bg-amber-500/20 border-amber-500/30">
        <Gavel className="h-3 w-3" />
        {label}
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="gap-1 text-muted-foreground">
      <Clipboard className="h-3 w-3" />
      {label}
    </Badge>
  );
}
