import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Calendar, MapPin, FileText, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function BrowseMeetings() {
  const { user } = useAuth();

  // Get jurisdiction ID (from user or guest session - default to Austin for guests)
  const jurisdictionId = user 
    ? undefined // Will use user's selected jurisdiction
    : "1e42532f-a7f2-44cc-ba2b-59422c79d47f"; // Austin for guests

  const now = new Date();
  const twoWeeksLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const { data: upcomingMeetings, isLoading: loadingUpcoming } = useQuery({
    queryKey: ['meetings-upcoming', jurisdictionId],
    queryFn: async () => {
      let query = supabase
        .from('meeting')
        .select('*')
        .gte('starts_at', now.toISOString())
        .lte('starts_at', twoWeeksLater.toISOString())
        .order('starts_at', { ascending: true });

      if (jurisdictionId) {
        query = query.eq('jurisdiction_id', jurisdictionId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const { data: pastMeetings, isLoading: loadingPast } = useQuery({
    queryKey: ['meetings-past', jurisdictionId],
    queryFn: async () => {
      let query = supabase
        .from('meeting')
        .select('*')
        .lt('starts_at', now.toISOString())
        .order('starts_at', { ascending: false })
        .limit(20);

      if (jurisdictionId) {
        query = query.eq('jurisdiction_id', jurisdictionId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const MeetingCard = ({ meeting }: { meeting: any }) => (
    <Link to={`/meeting/${meeting.id}`}>
      <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-1">{meeting.title}</h3>
            {meeting.body_name && (
              <p className="text-muted-foreground text-sm">{meeting.body_name}</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {meeting.starts_at && (
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{format(new Date(meeting.starts_at), 'MMM d, yyyy')}</span>
            </div>
          )}
          {meeting.starts_at && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{format(new Date(meeting.starts_at), 'h:mm a')}</span>
            </div>
          )}
          {meeting.location && (
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>{meeting.location}</span>
            </div>
          )}
          {meeting.agenda_url && (
            <div className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              <span>Agenda available</span>
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
        <div>
          <h1 className="text-3xl font-bold mb-2">Meetings</h1>
          <p className="text-muted-foreground">City council, county, and state sessions</p>
        </div>

        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="past">Past Meetings</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4 mt-6">
            {loadingUpcoming ? (
              <LoadingSkeleton />
            ) : upcomingMeetings && upcomingMeetings.length > 0 ? (
              <div className="space-y-4">
                {upcomingMeetings.map((meeting) => (
                  <MeetingCard key={meeting.id} meeting={meeting} />
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No upcoming meetings scheduled.</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Check back soon for updates from Austin, TX.
                </p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-4 mt-6">
            {loadingPast ? (
              <LoadingSkeleton />
            ) : pastMeetings && pastMeetings.length > 0 ? (
              <div className="space-y-4">
                {pastMeetings.map((meeting) => (
                  <MeetingCard key={meeting.id} meeting={meeting} />
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No past meetings available.</p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}