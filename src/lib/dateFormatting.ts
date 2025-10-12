import { format, formatDistanceToNow } from "date-fns";

/**
 * Legislation Date Fields:
 * 
 * - introduced_at: Official date legislation was introduced/proposed (PRIMARY)
 *   Used for: Sorting, filtering, main display date
 *   Source: Parsed from government website
 * 
 * - created_at: Database record creation timestamp (INTERNAL)
 *   Used for: Debugging, admin views only
 *   Source: Auto-set by Supabase on INSERT
 * 
 * - updated_at: Database record update timestamp (INTERNAL)
 *   Used for: Cache invalidation, showing record changes
 *   Source: Auto-set by Supabase on UPDATE
 * 
 * Default sort order: introduced_at DESC (newest first)
 */

export interface LegislationDateInfo {
  displayDate: string;
  label: string;
  relative?: string;
  fullDate?: string;
}

/**
 * Format legislation date for display with appropriate label
 * @param introducedAt - The date the legislation was officially introduced
 * @param updatedAt - Optional database update timestamp
 * @returns Formatted date info with label
 */
export const formatLegislationDate = (
  introducedAt: string | null,
  updatedAt?: string | null
): LegislationDateInfo => {
  const date = introducedAt || updatedAt;
  
  if (!date) {
    return {
      displayDate: 'Date unknown',
      label: '',
    };
  }

  const dateObj = new Date(date);
  
  return {
    displayDate: format(dateObj, 'MMM d, yyyy'), // e.g., "Oct 12, 2025"
    fullDate: format(dateObj, 'PPP'), // e.g., "October 12, 2025"
    label: introducedAt ? 'Introduced' : 'Added',
    relative: getRelativeTime(date),
  };
};

/**
 * Get human-readable relative time
 * @param dateString - ISO date string
 * @returns Relative time like "2 days ago" or "Today"
 */
export const getRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
};

/**
 * Check if an item was significantly updated after being introduced
 * @param introducedAt - Introduction date
 * @param updatedAt - Last update date
 * @returns True if updated more than 7 days after introduction
 */
export const isSignificantlyUpdated = (
  introducedAt: string | null,
  updatedAt: string | null
): boolean => {
  if (!introducedAt || !updatedAt) return false;
  
  const intro = new Date(introducedAt);
  const updated = new Date(updatedAt);
  const diffDays = Math.floor((updated.getTime() - intro.getTime()) / (1000 * 60 * 60 * 24));
  
  return diffDays > 7;
};
