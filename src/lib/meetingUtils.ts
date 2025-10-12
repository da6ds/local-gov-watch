import { addHours, isBefore, isAfter, differenceInHours, format } from 'date-fns';

export type MeetingStatus = 'upcoming' | 'in_progress' | 'completed' | 'cancelled';

/**
 * Automatically determine meeting status based on date/time
 */
export const calculateMeetingStatus = (startsAt: string, endsAt?: string | null): MeetingStatus => {
  const now = new Date();
  const start = new Date(startsAt);
  const end = endsAt ? new Date(endsAt) : addHours(start, 3);
  
  if (isBefore(now, start)) {
    return 'upcoming';
  }
  
  if (isAfter(now, start) && isBefore(now, end)) {
    return 'in_progress';
  }
  
  return 'completed';
};

/**
 * Get human-readable status label
 */
export const getMeetingStatusLabel = (status: MeetingStatus): string => {
  const labels: Record<MeetingStatus, string> = {
    upcoming: 'Upcoming',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled'
  };
  return labels[status];
};

/**
 * Get status color variant for badges
 */
export const getMeetingStatusVariant = (status: MeetingStatus): 'default' | 'destructive' | 'secondary' | 'outline' => {
  const variants: Record<MeetingStatus, 'default' | 'destructive' | 'secondary' | 'outline'> = {
    upcoming: 'default',
    in_progress: 'destructive',
    completed: 'secondary',
    cancelled: 'outline'
  };
  return variants[status];
};

/**
 * Check if meeting is happening soon (within 24 hours)
 */
export const isMeetingSoon = (startsAt: string): boolean => {
  const now = new Date();
  const meeting = new Date(startsAt);
  const hoursDiff = differenceInHours(meeting, now);
  
  return hoursDiff > 0 && hoursDiff <= 24;
};

/**
 * Check if agenda/minutes were recently posted (within 7 days)
 */
export const isDocumentRecent = (availableAt: string | null): boolean => {
  if (!availableAt) return false;
  
  const now = new Date();
  const posted = new Date(availableAt);
  const daysDiff = differenceInHours(now, posted) / 24;
  
  return daysDiff >= 0 && daysDiff <= 7;
};

/**
 * Get meeting time display with status indicators
 */
export const formatMeetingDateTime = (startsAt: string, endsAt?: string | null, status?: MeetingStatus) => {
  const meetingDate = new Date(startsAt);
  const calculatedStatus = status || calculateMeetingStatus(startsAt, endsAt);
  
  return {
    date: format(meetingDate, "PPPP"),
    time: format(meetingDate, "p"),
    endTime: endsAt ? format(new Date(endsAt), "p") : null,
    relative: getRelativeTime(startsAt),
    isSoon: isMeetingSoon(startsAt),
    status: getMeetingStatusLabel(calculatedStatus),
    statusValue: calculatedStatus
  };
};

const getRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMs < 0) {
    // Past meeting
    const absDays = Math.abs(diffDays);
    const absHours = Math.abs(diffHours);
    if (absHours < 1) return 'Just ended';
    if (absHours < 24) return `${absHours} hour${absHours === 1 ? '' : 's'} ago`;
    if (absDays === 1) return 'Yesterday';
    if (absDays < 7) return `${absDays} days ago`;
    return '';
  }
  
  // Future meeting
  if (diffHours < 1) return 'Starting soon!';
  if (diffHours < 2) return 'In 1 hour';
  if (diffHours < 24) return `In ${diffHours} hours`;
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays < 7) return `In ${diffDays} days`;
  return '';
};
