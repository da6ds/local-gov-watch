import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Calendar, AlertCircle, Vote } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, isPast, differenceInDays } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

export default function BrowseElections() {
  const { user } = useAuth();

  // Get jurisdiction ID (from user or guest session - default to Austin for guests)
  const jurisdictionId = user 
    ? undefined // Will use user's selected jurisdiction
    : "1e42532f-a7f2-44cc-ba2b-59422c79d47f"; // Austin for guests

  const now = new Date();
  const ninetyDaysLater = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  const { data: elections, isLoading } = useQuery({
    queryKey: ['elections', jurisdictionId],
    queryFn: async () => {
      let query = supabase
        .from('election')
        .select('*')
        .gte('date', now.toISOString().split('T')[0])
        .lte('date', ninetyDaysLater.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (jurisdictionId) {
        query = query.eq('jurisdiction_id', jurisdictionId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const getElectionBadge = (election: any) => {
    const daysUntil = differenceInDays(new Date(election.date), now);
    
    if (daysUntil <= 7) {
      return <Badge variant="destructive">This Week</Badge>;
    } else if (daysUntil <= 30) {
      return <Badge variant="default">This Month</Badge>;
    } else {
      return <Badge variant="secondary">Upcoming</Badge>;
    }
  };

  const getRegistrationStatus = (election: any) => {
    if (!election.registration_deadline) return null;
    
    const deadline = new Date(election.registration_deadline);
    const daysUntilDeadline = differenceInDays(deadline, now);
    
    if (isPast(deadline)) {
      return (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>Registration closed</span>
        </div>
      );
    } else if (daysUntilDeadline <= 7) {
      return (
        <div className="flex items-center gap-2 text-destructive text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>Register by {format(deadline, 'MMM d, yyyy')}</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Calendar className="h-4 w-4" />
          <span>Register by {format(deadline, 'MMM d, yyyy')}</span>
        </div>
      );
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Elections</h1>
          <p className="text-muted-foreground">Upcoming elections and deadlines</p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-4" />
                <Skeleton className="h-4 w-1/2" />
              </Card>
            ))}
          </div>
        ) : elections && elections.length > 0 ? (
          <div className="space-y-4">
            {elections.map((election) => (
              <Link key={election.id} to={`/elections/${election.id}`}>
                <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{election.name}</h3>
                      {getElectionBadge(election)}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <Vote className="h-4 w-4" />
                      <span className="text-sm capitalize">{election.kind} election</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Election Day:</span>
                    <span>{format(new Date(election.date), 'EEEE, MMMM d, yyyy')}</span>
                  </div>
                  
                  {getRegistrationStatus(election)}

                  {election.info_url && (
                    <a 
                      href={election.info_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline inline-block mt-2"
                    >
                      More information →
                    </a>
                  )}
                </div>
              </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No upcoming elections in the next 90 days.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Check back soon for updates from Austin, TX.
            </p>
          </Card>
        )}
      </div>
    </Layout>
  );
}