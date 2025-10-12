import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Calendar, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { getGuestScope, getGuestTopics } from "@/lib/guestSessionStorage";
import { StatusFilter } from "@/components/filters/StatusFilter";
import { CityBadge } from "@/components/CityBadge";

export default function BrowseMeetings() {
  const [jurisdictionIds, setJurisdictionIds] = useState<string[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const statusParam = searchParams.get("status") || "all";

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

  // Fetch meetings based on status filter
  const { data: meetings, isLoading } = useQuery({
    queryKey: ['browse', 'meetings', jurisdictionIds, statusParam],
    queryFn: async () => {
      const now = new Date();
      const topicIds = getGuestTopics();

      let query = supabase
        .from('meeting')
        .select(`
          *,
          jurisdiction:jurisdiction_id (name, slug, type)
        `)
        .in('jurisdiction_id', jurisdictionIds);

      // Apply time-based filtering based on status
      if (statusParam === "upcoming") {
        query = query.gte('starts_at', now.toISOString());
      } else if (statusParam === "this-week") {
        const weekStart = startOfWeek(now);
        const weekEnd = endOfWeek(now);
        query = query
          .gte('starts_at', weekStart.toISOString())
          .lte('starts_at', weekEnd.toISOString());
      } else if (statusParam === "today") {
        const dayStart = startOfDay(now);
        const dayEnd = endOfDay(now);
        query = query
          .gte('starts_at', dayStart.toISOString())
          .lte('starts_at', dayEnd.toISOString());
      } else if (statusParam === "past") {
        query = query.lt('starts_at', now.toISOString());
      }
      // "all" shows everything

      // Note: Topic filtering temporarily simplified to avoid TS type recursion

      query = query.order('starts_at', {
        ascending: statusParam === "past" ? false : true 
      });

      if (statusParam === "past") {
        query = query.limit(20);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching meetings:', error);
        throw error;
      }

      return data || [];
    },
    enabled: jurisdictionIds.length > 0,
  });

  const handleStatusChange = (value: string) => {
    if (value === "all") {
      searchParams.delete("status");
    } else {
      searchParams.set("status", value);
    }
    setSearchParams(searchParams);
  };

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
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Browse Meetings</h1>
          <StatusFilter 
            value={statusParam}
            onChange={handleStatusChange}
            count={meetings?.length}
          />
        </div>
        
        <div className="space-y-4">
          {isLoading ? (
            <LoadingSkeleton />
          ) : !meetings || meetings.length === 0 ? (
            <p className="text-muted-foreground">No meetings found</p>
          ) : (
            meetings.map((meeting) => (
              <MeetingCard key={meeting.id} meeting={meeting} />
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
