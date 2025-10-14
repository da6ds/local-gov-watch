import { Layout } from "@/components/Layout";
import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { MeetingFilters } from "@/components/MeetingFilters";
import { useMeetingFilters } from "@/hooks/useMeetingFilters";
import { sortMeetings } from "@/lib/meetingSorting";
import { filterMeetings, getAvailableMeetingFilters } from "@/lib/meetingFiltering";
import { useTrackedTermsFilter } from "@/hooks/useTrackedTermsFilter";
import { filterMeetingsByTrackedTerms } from "@/lib/trackedTermsFiltering";
import { Calendar, MapPin, ExternalLink, Filter } from "lucide-react";
import { format } from "date-fns";
import { useFilteredMeetings } from "@/hooks/useFilteredQueries";
import { useLocationFilter } from "@/contexts/LocationFilterContext";
import { CityBadge } from "@/components/CityBadge";
import { MeetingTypeBadge } from "@/components/MeetingTypeBadge";
import { MeetingStatusBadge } from "@/components/meeting/MeetingStatusBadge";
import { ExternalLink as LinkIcon } from "lucide-react";

export default function BrowseMeetings() {
  const { selectedLocationSlugs } = useLocationFilter();
  const { filters, setFilters } = useMeetingFilters();
  const { activeKeywords, hasActiveFilters: hasTrackedTermsFilter, activeTerms } = useTrackedTermsFilter();

  // Fetch meetings using filtered query
  const { data: meetings, isLoading } = useFilteredMeetings({ upcoming: false, limit: 100 });

  // Get available filter options
  const availableFilters = useMemo(() => {
    if (!meetings) return { 
      cities: [], 
      bodyNames: [], 
      typeCounts: { 
        city_council: 0, 
        board_of_supervisors: 0, 
        committee: 0, 
        commission: 0, 
        authority: 0 
      } 
    };
    return getAvailableMeetingFilters(meetings);
  }, [meetings]);

  // Apply filters and sorting
  const processedMeetings = useMemo(() => {
    if (!meetings) return [];
    
    // First apply standard filters
    let filtered = filterMeetings(meetings, filters);
    
    // Then apply tracked terms filter
    if (hasTrackedTermsFilter) {
      filtered = filterMeetingsByTrackedTerms(filtered, activeKeywords);
    }
    
    // Then sort
    const sorted = sortMeetings(filtered, filters.sortBy);
    
    return sorted;
  }, [meetings, filters, activeKeywords, hasTrackedTermsFilter]);


  const MeetingCard = ({ meeting }: { meeting: any }) => (
    <Link to={`/meetings/${meeting.id}`}>
      <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {meeting.meeting_type && (
                <MeetingTypeBadge 
                  meetingType={meeting.meeting_type} 
                  isLegislative={meeting.is_legislative || false}
                />
              )}
              <MeetingStatusBadge
                status={meeting.status || 'upcoming'}
                agendaStatus={(meeting as any).agenda_status}
                minutesStatus={(meeting as any).minutes_status}
                startsAt={meeting.starts_at}
              />
            </div>
            
            {/* Live Stream Button */}
            {meeting.status === 'in_progress' && (meeting as any).live_stream_url && (
              <a 
                href={(meeting as any).live_stream_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-md transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <LinkIcon className="h-3.5 w-3.5" />
                Watch Live
              </a>
            )}
            
            <div>
              <h3 className="text-lg font-semibold">{meeting.title}</h3>
            </div>
            <h3 className="text-lg font-semibold">{meeting.title}</h3>
            {meeting.body_name && (
              <p className="text-muted-foreground text-sm">{meeting.body_name}</p>
            )}
          </div>
          {meeting.jurisdiction?.name && (
            <CityBadge city={meeting.jurisdiction.name} size="small" />
          )}
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {meeting.starts_at && (
            <>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{format(new Date(meeting.starts_at), 'MMM d, yyyy')}</span>
              </div>
              <div className="flex items-center gap-1">
                <span>{format(new Date(meeting.starts_at), 'h:mm a')}</span>
              </div>
            </>
          )}
          {meeting.location && (
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>{meeting.location}</span>
            </div>
          )}
          {meeting.agenda_url && (
            <div className="flex items-center gap-1">
              <ExternalLink className="h-4 w-4" />
              <span>Agenda</span>
            </div>
          )}
        </div>
      </Card>
    </Link>
  );

  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="p-6">
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2 mb-4" />
          <Skeleton className="h-4 w-full" />
        </Card>
      ))}
    </div>
  );

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Browse Meetings</h1>

        {/* Tracked Terms Indicator */}
        {hasTrackedTermsFilter && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
            <Filter className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">
              Filtering by {activeTerms.length} tracked topic{activeTerms.length !== 1 ? 's' : ''}:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {activeTerms.map((term) => (
                <span 
                  key={term.id} 
                  className="px-2 py-0.5 bg-primary/20 text-primary text-xs font-medium rounded-full"
                >
                  {term.name}
                </span>
              ))}
            </div>
          </div>
        )}

        <MeetingFilters
          currentFilters={filters}
          onFilterChange={setFilters}
          availableFilters={availableFilters}
        />

        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            Showing {processedMeetings.length} of {meetings?.length || 0} meetings
            {hasTrackedTermsFilter && ' matching your tracked topics'}
          </p>
        </div>
        
        <div className="space-y-4">
          {isLoading ? (
            <LoadingSkeleton />
          ) : !processedMeetings || processedMeetings.length === 0 ? (
            <p className="text-muted-foreground">No meetings found matching your filters</p>
          ) : (
            processedMeetings.map((meeting) => (
              <MeetingCard key={meeting.id} meeting={meeting} />
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
