import { Layout } from "@/components/Layout";
import { useMemo, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { MeetingFilters } from "@/components/MeetingFilters";
import { useMeetingFilters } from "@/hooks/useMeetingFilters";
import { sortMeetings } from "@/lib/meetingSorting";
import { filterMeetings, getAvailableMeetingFilters } from "@/lib/meetingFiltering";
import { useTrackedTermsFilter } from "@/hooks/useTrackedTermsFilter";
import { filterMeetingsByTrackedTerms } from "@/lib/trackedTermsFiltering";
import { Calendar, MapPin, ExternalLink, Filter, TestTube2, Search } from "lucide-react";
import { format } from "date-fns";
import { useFilteredMeetings } from "@/hooks/useFilteredQueries";
import { useLocationFilter } from "@/contexts/LocationFilterContext";
import { CityBadge } from "@/components/CityBadge";
import { MeetingTypeBadge } from "@/components/MeetingTypeBadge";
import { MeetingStatusBadge } from "@/components/meeting/MeetingStatusBadge";
import { ExternalLink as LinkIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CollapsibleSection } from "@/components/CollapsibleSection";
export default function BrowseMeetings() {
  const [searchTerm, setSearchTerm] = useState("");
  const {
    selectedLocationSlugs
  } = useLocationFilter();
  const {
    filters,
    setFilters
  } = useMeetingFilters();
  const {
    activeKeywords,
    hasActiveFilters: hasTrackedTermsFilter,
    activeTerms
  } = useTrackedTermsFilter();

  // Debounced search
  const debouncedSearch = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (value: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          setSearchTerm(value);
        }, 300);
      };
    })(),
    []
  );

  // Fetch meetings using filtered query - get ALL meetings (no date filter)
  const {
    data: meetings,
    isLoading
  } = useFilteredMeetings({
    limit: 500
  });

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
      },
      agendaCount: 0,
      minutesCount: 0,
      liveCount: 0
    };
    const baseFilters = getAvailableMeetingFilters(meetings);
    return {
      ...baseFilters,
      agendaCount: meetings.filter(m => m.agenda_url).length,
      minutesCount: meetings.filter(m => m.minutes_url).length,
      liveCount: meetings.filter(m => m.status === 'in_progress').length
    };
  }, [meetings]);

  // Apply search, filters and sorting
  const processedMeetings = useMemo(() => {
    if (!meetings) return [];

    // First apply search filter
    let filtered = meetings;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = meetings.filter(m => 
        m.title?.toLowerCase().includes(term) ||
        m.body_name?.toLowerCase().includes(term) ||
        m.location?.toLowerCase().includes(term)
      );
    }

    // Then apply standard filters
    filtered = filterMeetings(filtered, filters);

    // Then apply tracked terms filter
    if (hasTrackedTermsFilter) {
      filtered = filterMeetingsByTrackedTerms(filtered, activeKeywords);
    }

    // Then sort
    const sorted = sortMeetings(filtered, filters.sortBy);
    return sorted;
  }, [meetings, filters, activeKeywords, hasTrackedTermsFilter, searchTerm]);
  const MeetingCard = ({
    meeting
  }: {
    meeting: any;
  }) => <Link to={`/meetings/${meeting.id}`}>
      <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {meeting.meeting_type && <MeetingTypeBadge meetingType={meeting.meeting_type} isLegislative={meeting.is_legislative || false} />}
              <MeetingStatusBadge status={meeting.status || 'upcoming'} agendaStatus={(meeting as any).agenda_status} minutesStatus={(meeting as any).minutes_status} startsAt={meeting.starts_at} />
            </div>
            
            {/* Live Stream Button */}
            {meeting.status === 'in_progress' && (meeting as any).live_stream_url && <a href={(meeting as any).live_stream_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-md transition-colors mb-2" onClick={e => e.stopPropagation()}>
                <LinkIcon className="h-3.5 w-3.5" />
                Watch Live
              </a>}
            
            <h3 className="text-lg font-semibold">{meeting.title}</h3>
            {meeting.body_name && meeting.body_name !== meeting.title && <p className="text-muted-foreground text-sm">{meeting.body_name}</p>}
          </div>
          {meeting.jurisdiction?.name && <CityBadge city={meeting.jurisdiction.name} size="small" />}
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {meeting.starts_at && <>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{format(new Date(meeting.starts_at), 'MMM d, yyyy')}</span>
              </div>
              <div className="flex items-center gap-1">
                <span>{format(new Date(meeting.starts_at), 'h:mm a')}</span>
              </div>
            </>}
          {meeting.location && <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>{meeting.location}</span>
            </div>}
          {meeting.agenda_url && <div className="flex items-center gap-1">
              <ExternalLink className="h-4 w-4" />
              <span>Agenda</span>
            </div>}
        </div>
      </Card>
    </Link>;
  const LoadingSkeleton = () => <div className="space-y-4">
      {[1, 2, 3].map(i => <Card key={i} className="p-6">
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2 mb-4" />
          <Skeleton className="h-4 w-full" />
        </Card>)}
    </div>;

  // Check if test meetings exist
  const hasTestData = useMemo(() => meetings?.some(m => m.external_id?.startsWith('test-')), [meetings]);
  return <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Browse Meetings</h1>

        {/* Search and Sort */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search meetings..."
              onChange={(e) => debouncedSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filters.sortBy} onValueChange={(value) => setFilters({ ...filters, sortBy: value as any })}>
            <SelectTrigger className="w-full sm:w-[220px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date_desc">Date (Newest First)</SelectItem>
              <SelectItem value="date_asc">Date (Oldest First)</SelectItem>
              <SelectItem value="title_asc">Alphabetical (A-Z)</SelectItem>
              <SelectItem value="title_desc">Alphabetical (Z-A)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tracked Terms Indicator */}
        {hasTrackedTermsFilter && <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
            <Filter className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">
              Filtering by {activeTerms.length} tracked topic{activeTerms.length !== 1 ? 's' : ''}:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {activeTerms.map(term => <span key={term.id} className="px-2 py-0.5 bg-primary/20 text-primary text-xs font-medium rounded-full">
                  {term.name}
                </span>)}
            </div>
          </div>}

        {/* Filters Section */}
        <CollapsibleSection 
          storageKey="meetings-filters" 
          title="Filters"
          defaultExpanded={true}
        >
          <MeetingFilters currentFilters={filters} onFilterChange={setFilters} availableFilters={availableFilters} />
        </CollapsibleSection>

        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            Showing {processedMeetings.length} of {meetings?.length || 0} meetings
            {hasTrackedTermsFilter && ' matching your tracked topics'}
          </p>
          {processedMeetings.length === 0 && meetings && meetings.length > 0 && <span className="text-sm text-yellow-500 font-medium">
              ⚠️ All meetings hidden by active filters
            </span>}
        </div>
        
        <div className="space-y-4">
          {isLoading ? <LoadingSkeleton /> : !processedMeetings || processedMeetings.length === 0 ? <p className="text-muted-foreground">No meetings found matching your filters</p> : processedMeetings.map(meeting => <MeetingCard key={meeting.id} meeting={meeting} />)}
        </div>
      </div>
    </Layout>;
}