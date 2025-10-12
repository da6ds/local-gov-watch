import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Calendar, ExternalLink } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { getGuestScope, getGuestTopics } from "@/lib/guestSessionStorage";
import { CityBadge } from "@/components/CityBadge";
import { MeetingFilters } from "@/components/MeetingFilters";
import { useMeetingFilters } from "@/hooks/useMeetingFilters";
import { sortMeetings } from "@/lib/meetingSorting";
import { filterMeetings, getAvailableMeetingFilters } from "@/lib/meetingFiltering";

export default function BrowseMeetings() {
  const [jurisdictionIds, setJurisdictionIds] = useState<string[]>([]);
  const { filters, setFilters } = useMeetingFilters();

  // Resolve jurisdiction IDs
  useEffect(() => {
    const fetchIds = async () => {
      const guestScope = getGuestScope();
      const { data } = await supabase
        .from('jurisdiction')
        .select('id')
        .in('slug', guestScope);
      
      if (data) {
        setJurisdictionIds(data.map(j => j.id));
      }
    };
    fetchIds();
  }, []);

  // Fetch all meetings (filtering will be done client-side)
  const { data: meetings, isLoading } = useQuery({
    queryKey: ['browse', 'meetings', jurisdictionIds],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meeting')
        .select(`
          *,
          jurisdiction:jurisdiction_id (name, slug, type)
        `)
        .in('jurisdiction_id', jurisdictionIds)
        .order('starts_at', { ascending: false });

      if (error) {
        console.error('Error fetching meetings:', error);
        throw error;
      }

      return data || [];
    },
    enabled: jurisdictionIds.length > 0,
  });

  // Get available filter options
  const availableFilters = useMemo(() => {
    if (!meetings) return { cities: [], bodyNames: [] };
    return getAvailableMeetingFilters(meetings);
  }, [meetings]);

  // Apply filters and sorting
  const processedMeetings = useMemo(() => {
    if (!meetings) return [];
    
    const filtered = filterMeetings(meetings, filters);
    const sorted = sortMeetings(filtered, filters.sortBy);
    
    return sorted;
  }, [meetings, filters]);


  const MeetingCard = ({ meeting }: { meeting: any }) => (
    <Link to={`/meetings/${meeting.id}`}>
      <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-1">{meeting.title}</h3>
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

        <MeetingFilters
          currentFilters={filters}
          onFilterChange={setFilters}
          availableFilters={availableFilters}
        />

        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            Showing {processedMeetings.length} of {meetings?.length || 0} meetings
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
