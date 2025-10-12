import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Link } from "react-router-dom";
import { TrendingUp, Calendar, FileText, Scale, Bell, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, formatDistanceToNow } from "date-fns";
import { TrendingTopicsWidget } from "@/components/TrendingTopicsWidget";
import { analyzeCombinedTrendingTopics } from "@/lib/trendingTopics";
import { useState, useEffect, useMemo } from "react";
import { useDataStatus } from "@/hooks/useDataStatus";
import { useGuestRunUpdate } from "@/hooks/useGuestRunUpdate";
import { toast } from "sonner";
import { LocationSelector } from "@/components/LocationSelector";
import { Calendar as CalendarComponent } from "@/components/calendar/Calendar";
import { getGuestScope, setGuestScope, getGuestTopics } from "@/lib/guestSessionStorage";
import { Button } from "@/components/ui/button";
import { useLocationFilter } from "@/contexts/LocationFilterContext";
import { useFilteredDashboardData, useFilteredTrendingTopics } from "@/hooks/useFilteredQueries";

export default function Dashboard() {
  const queryClient = useQueryClient();
  const { isGuest, guestSession } = useAuth();
  const { selectedLocationSlugs, jurisdictionIds, setSelectedLocations } = useLocationFilter();
  const [scopeString, setScopeString] = useState<string>('');
  const runUpdate = useGuestRunUpdate();
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);
  const [autoRefreshEta, setAutoRefreshEta] = useState<number | null>(null);

  // Build scope string for data status checks
  useEffect(() => {
    if (jurisdictionIds.length === 0) return;
    
    const fetchScopeString = async () => {
      const { data } = await supabase
        .from('jurisdiction')
        .select('slug, type')
        .in('id', jurisdictionIds);
      
      if (data) {
        const scopeParts = data.map(j => `${j.type}:${j.slug}`);
        setScopeString(scopeParts.join(','));
      }
    };
    
    fetchScopeString();
  }, [jurisdictionIds]);

  // Handle jurisdiction change
  const handleJurisdictionChange = (slugs: string[]) => {
    setSelectedLocations(slugs);
    
    // Invalidate all data queries
    queryClient.invalidateQueries({ queryKey: ['filtered-dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['filtered-legislation'] });
    queryClient.invalidateQueries({ queryKey: ['filtered-meetings'] });
    queryClient.invalidateQueries({ queryKey: ['filtered-trending-topics'] });
    queryClient.invalidateQueries({ queryKey: ['calendar'] });
    
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

  // Fetch data using filtered queries
  const { data: dashboardData, isLoading: dashboardLoading } = useFilteredDashboardData();
  const { data: trendingTopicsData, isLoading: trendingLoading } = useFilteredTrendingTopics(8);

  const recentLegislation = dashboardData?.legislation || [];
  const upcomingMeetings = dashboardData?.meetings || [];
  const upcomingElections = dashboardData?.elections || [];

  // Use trending topics from filtered query
  const trendingTopics = trendingTopicsData || [];

  return (
    <TooltipProvider>
      <Layout>
        <div className="space-y-3">
          {/* Header */}
          <div>
            <h1 className="text-xl font-bold mb-0.5">Dashboard</h1>
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

          {/* Alert Summary Card */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bell className="h-4 w-4" />
                Alert Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{recentLegislation.length}</div>
                  <p className="text-sm text-muted-foreground">new matches today</p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/alerts">View All</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Snapshot Cards - Only Legislation and Meetings */}
          <div className="grid md:grid-cols-2 gap-3">
            {/* Recent Legislation */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <Link to="/browse/legislation" className="group" aria-label="View all recent legislation updates">
                  <CardTitle className="flex items-center gap-2 hover:text-primary transition-colors text-base" role="heading" aria-level={2}>
                    <Scale className="h-4 w-4 text-primary" />
                    Recent Updates
                    <span className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true">→</span>
                  </CardTitle>
                </Link>
                <CardDescription className="text-xs">New bills and ordinances</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-2xl font-bold mb-2">{recentLegislation.length}</p>
                {recentLegislation.length > 0 ? (
                  <div className="space-y-2 mb-3">
                    {recentLegislation.slice(0, typeof window !== 'undefined' && window.innerWidth >= 768 ? 5 : 3).map((item: any) => (
                      <Link 
                        key={item.id} 
                        to={`/legislation/${item.id}`}
                        className="block text-sm text-foreground hover:text-primary line-clamp-1"
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
              <CardHeader className="pb-2">
                <Link to="/browse/meetings" className="group" aria-label="View all upcoming meetings">
                  <CardTitle className="flex items-center gap-2 hover:text-primary transition-colors text-base" role="heading" aria-level={2}>
                    <Calendar className="h-4 w-4 text-primary" />
                    Upcoming Meetings
                    <span className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true">→</span>
                  </CardTitle>
                </Link>
                <CardDescription className="text-xs">City & county sessions</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-2xl font-bold mb-2">{upcomingMeetings.length}</p>
                {upcomingMeetings.length > 0 ? (
                  <div className="space-y-2 mb-3">
                    {upcomingMeetings.slice(0, typeof window !== 'undefined' && window.innerWidth >= 768 ? 5 : 3).map((meeting: any) => (
                      <Link
                        key={meeting.id}
                        to={`/meeting/${meeting.id}`}
                        className="block text-sm"
                      >
                        <p className="text-foreground hover:text-primary line-clamp-1">
                          • {meeting.title || meeting.body_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {meeting.starts_at && format(new Date(meeting.starts_at), 'MMM d, h:mm a')}
                        </p>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground mb-3">No meetings scheduled</p>
                )}
                <Button variant="link" asChild className="p-0 h-auto text-sm">
                  <Link to="/calendar">View calendar →</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Grid: Calendar & Trends */}
          <div className="grid lg:grid-cols-2 gap-3">
            {/* Calendar Card */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-base font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Calendar
                </h2>
                <Link to="/calendar">
                  <Button variant="ghost" size="sm" className="gap-1 h-8">
                    View all
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
              <CalendarComponent variant="dashboard" />
            </div>

            {/* Trends Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base" role="heading" aria-level={2}>
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Trending Topics
                </CardTitle>
                <CardDescription className="text-xs">Most mentioned in recent activity</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <TrendingTopicsWidget 
                  topics={trendingTopics}
                  isLoading={dashboardLoading || trendingLoading || isAutoRefreshing}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    </TooltipProvider>
  );
}
