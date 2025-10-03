import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Link } from "react-router-dom";
import { TrendingUp, Calendar, FileText, Scale, Vote } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, formatDistanceToNow } from "date-fns";
import { TrendsPlaceholder } from "@/components/TrendsPlaceholder";
import { useDataStatus } from "@/hooks/useDataStatus";
import { useGuestRunUpdate } from "@/hooks/useGuestRunUpdate";
import { toast } from "sonner";
import React, { useState, useEffect } from "react";
import { LocationSelector } from "@/components/LocationSelector";
import { Calendar as CalendarComponent } from "@/components/calendar/Calendar";
import { ArrowRight } from "lucide-react";
import { getGuestScope, setGuestScope, getGuestTopics } from "@/lib/guestSessionStorage";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const queryClient = useQueryClient();
  const { isGuest, guestSession } = useAuth();
  const [selectedJurisdictions, setSelectedJurisdictions] = useState<string[]>([]);
  const [scopeString, setScopeString] = useState<string>('');
  const [jurisdictionIds, setJurisdictionIds] = useState<string[]>([]);
  const runUpdate = useGuestRunUpdate();
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);
  const [autoRefreshEta, setAutoRefreshEta] = useState<number | null>(null);

  // Initialize jurisdictions from guest session
  useEffect(() => {
    const guestScope = getGuestScope();
    setSelectedJurisdictions(guestScope);
    setScopeString(guestScope.join(','));
  }, []);

  // Resolve jurisdiction IDs when scope changes
  useEffect(() => {
    if (selectedJurisdictions.length === 0) return;
    
    const fetchIds = async () => {
      const { data } = await supabase
        .from('jurisdiction')
        .select('id, slug, type')
        .in('slug', selectedJurisdictions);
      
      if (data) {
        setJurisdictionIds(data.map(j => j.id));
        const scopeParts = data.map(j => `${j.type}:${j.slug}`);
        setScopeString(scopeParts.join(','));
      }
    };
    
    fetchIds();
  }, [selectedJurisdictions]);

  // Handle jurisdiction change
  const handleJurisdictionChange = (slugs: string[]) => {
    setSelectedJurisdictions(slugs);
    setGuestScope(slugs);
    setScopeString(slugs.join(','));
    
    // Invalidate all data queries
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['calendar'] });
    queryClient.invalidateQueries({ queryKey: ['browse'] });
    queryClient.invalidateQueries({ queryKey: ['trends'] });
    
    toast.success("Location updated");
  };

  // Check data status
  const { data: dataStatus, refetch: refetchDataStatus, isLoading: isDataStatusLoading } = useDataStatus(scopeString || 'city:austin-tx,county:travis-county-tx,state:texas');

  // Auto-refresh on load if mode is seed and no data
  useEffect(() => {
    if (dataStatus && dataStatus.mode === 'seed' && !isAutoRefreshing && guestSession) {
      const totalCounts = dataStatus.tableCounts.meetings + dataStatus.tableCounts.legislation + dataStatus.tableCounts.elections;
      
      if (totalCounts === 0) {
        setIsAutoRefreshing(true);
        setAutoRefreshEta(dataStatus.totalEstimate || 120000);
        
        runUpdate.mutateAsync({
          scope: scopeString,
          sessionId: (guestSession as any)?.session_id || (typeof guestSession === 'string' ? guestSession : undefined)
        }).catch(error => {
          console.error('Auto-refresh failed:', error);
          setIsAutoRefreshing(false);
        });
      }
    }
  }, [dataStatus?.mode, guestSession, isAutoRefreshing]);

  // Poll data status during auto-refresh
  useEffect(() => {
    if (!isAutoRefreshing) return;

    const interval = setInterval(async () => {
      const { data } = await refetchDataStatus();
      
      if (data && data.mode === 'live') {
        setIsAutoRefreshing(false);
        setAutoRefreshEta(null);
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        toast.success("Local data loaded!");
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoRefreshing, refetchDataStatus, queryClient]);

  // Fetch data using dashboard API with topic filtering from sessionStorage
  const topicsParam = getGuestTopics().join(',');
  
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['dashboard', scopeString, topicsParam],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('dashboard-api', {
        body: { scope: scopeString, topics: topicsParam }
      });

      if (error) throw error;
      return data || { legislation: [], meetings: [], elections: [] };
    },
    enabled: !!scopeString && jurisdictionIds.length > 0 && !isAutoRefreshing,
  });

  const recentLegislation = dashboardData?.legislation || [];
  const upcomingMeetings = dashboardData?.meetings || [];
  const upcomingElections = dashboardData?.elections || [];

  return (
    <TooltipProvider>
      <Layout>
        <div className="space-y-4 md:space-y-6">
          {/* Header - visible on mobile only */}
          <div className="md:hidden">
            <h1 className="text-2xl md:text-3xl font-bold mb-1">Dashboard</h1>
            {/* Subtle status line */}
            <div className="text-xs md:text-sm text-muted-foreground" aria-live="polite">
              {isAutoRefreshing ? (
                <span>Updating... ~{Math.round((autoRefreshEta || 120000) / 1000 / 60)}m remaining</span>
              ) : dataStatus?.mode === 'live' && dataStatus.lastRunAt ? (
                <span>Live as of {formatDistanceToNow(new Date(dataStatus.lastRunAt), { addSuffix: true })}</span>
              ) : dataStatus?.mode === 'seed' && dataStatus.reason === 'no-successful-runs' && 
                 (dataStatus.tableCounts.meetings + dataStatus.tableCounts.legislation + dataStatus.tableCounts.elections === 0) ? (
                <span>No recent local updates yet</span>
              ) : null}
            </div>
          </div>

          {/* Snapshot Cards */}
          <div className="grid md:grid-cols-3 gap-3 md:gap-4">
            {/* Recent Legislation */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <Link to="/browse/legislation" className="group" aria-label="View all recent legislation updates">
                  <CardTitle className="text-base md:text-lg flex items-center gap-2 hover:text-primary transition-colors" role="heading" aria-level={2}>
                    <Scale className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                    Recent Updates
                    <span className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true">→</span>
                  </CardTitle>
                </Link>
                <CardDescription className="text-xs md:text-sm">New bills and ordinances</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl md:text-3xl font-bold mb-2">{recentLegislation.length}</p>
                {recentLegislation.length > 0 ? (
                  <div className="space-y-1.5 md:space-y-2 mb-3">
                    {recentLegislation.slice(0, 3).map((item: any) => (
                      <Link 
                        key={item.id} 
                        to={`/legislation/${item.id}`}
                        className="block text-xs md:text-sm text-foreground hover:text-primary line-clamp-1"
                      >
                        • {item.title}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs md:text-sm text-muted-foreground mb-3">No recent updates</p>
                )}
                <Button variant="link" asChild className="p-0 h-auto text-xs md:text-sm">
                  <Link to="/browse/legislation">View all →</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Upcoming Meetings */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <Link to="/browse/meetings" className="group" aria-label="View all upcoming meetings">
                  <CardTitle className="text-base md:text-lg flex items-center gap-2 hover:text-primary transition-colors" role="heading" aria-level={2}>
                    <Calendar className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                    Upcoming Meetings
                    <span className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true">→</span>
                  </CardTitle>
                </Link>
                <CardDescription className="text-xs md:text-sm">City & county sessions</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl md:text-3xl font-bold mb-2">{upcomingMeetings.length}</p>
                {upcomingMeetings.length > 0 ? (
                  <div className="space-y-1.5 md:space-y-2 mb-3">
                    {upcomingMeetings.slice(0, 3).map((meeting: any) => (
                      <Link
                        key={meeting.id}
                        to={`/meeting/${meeting.id}`}
                        className="block text-xs md:text-sm"
                      >
                        <p className="text-foreground hover:text-primary line-clamp-1">
                          • {meeting.title || meeting.body_name}
                        </p>
                        <p className="text-[10px] md:text-xs text-muted-foreground">
                          {meeting.starts_at && format(new Date(meeting.starts_at), 'MMM d, h:mm a')}
                        </p>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs md:text-sm text-muted-foreground mb-3">No meetings scheduled</p>
                )}
                <Button variant="link" asChild className="p-0 h-auto text-xs md:text-sm">
                  <Link to="/calendar">View calendar →</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Upcoming Elections */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <Link to="/browse/elections" className="group" aria-label="View all upcoming elections">
                  <CardTitle className="text-base md:text-lg flex items-center gap-2 hover:text-primary transition-colors" role="heading" aria-level={2}>
                    <Vote className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                    Upcoming Elections
                    <span className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true">→</span>
                  </CardTitle>
                </Link>
                <CardDescription className="text-xs md:text-sm">Register and vote</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl md:text-3xl font-bold mb-2">{upcomingElections.length}</p>
                {upcomingElections.length > 0 ? (
                  <div className="space-y-1.5 md:space-y-2 mb-3">
                    {upcomingElections.map((election: any) => (
                      <Link
                        key={election.id}
                        to={`/election/${election.id}`}
                        className="block text-sm"
                      >
                        <p className="text-foreground hover:text-primary line-clamp-1">
                          • {election.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {election.date && format(new Date(election.date), 'MMM d, yyyy')}
                        </p>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground mb-3">No elections scheduled</p>
                )}
                <Button variant="link" asChild className="p-0 h-auto">
                  <Link to="/browse/elections">View all →</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Grid: Calendar & Trends */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Calendar Card */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Calendar
                </h2>
                <Link to="/calendar">
                  <Button variant="ghost" size="sm" className="gap-2">
                    View all
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <CalendarComponent variant="dashboard" />
            </div>

            {/* Trends Card */}
            <Card>
              <CardHeader>
                <Link to="/browse/trends" className="group" aria-label="View all trends">
                  <CardTitle className="flex items-center gap-2 hover:text-primary transition-colors cursor-pointer" role="heading" aria-level={2}>
                    <TrendingUp className="h-5 w-5" />
                    Trending Topics
                    <span className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true">→</span>
                  </CardTitle>
                </Link>
              </CardHeader>
              <CardContent>
                <TrendsPlaceholder />
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    </TooltipProvider>
  );
}
