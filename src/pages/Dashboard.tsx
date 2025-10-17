import { Layout } from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Calendar, Scale, MapPin, CalendarDays } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, formatDistanceToNow } from "date-fns";
import { useState, useEffect } from "react";
import { useDataStatus } from "@/hooks/useDataStatus";
import { useGuestRunUpdate } from "@/hooks/useGuestRunUpdate";
import { toast } from "sonner";
import { Calendar as CalendarComponent } from "@/components/calendar/Calendar";
import { Button } from "@/components/ui/button";
import { useLocationFilter } from "@/contexts/LocationFilterContext";
import { useFilteredDashboardData } from "@/hooks/useFilteredQueries";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

  const recentLegislation = dashboardData?.legislation || [];
  const upcomingMeetings = dashboardData?.meetings || [];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
          {/* Subtle status line */}
          <div className="text-sm text-muted-foreground" aria-live="polite">
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

        {/* Top Row - Meetings & Calendar */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Meetings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Upcoming Meetings
                {upcomingMeetings.length > 0 && <Badge variant="secondary">{upcomingMeetings.length}</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingMeetings.length > 0 ? (
                  <>
                    {upcomingMeetings.slice(0, 5).map((meeting: any) => (
                      <Link
                        key={meeting.id}
                        to={`/meetings/${meeting.id}`}
                        className="block border-l-2 border-primary pl-3 hover:bg-accent rounded-r transition-colors"
                      >
                        {/* Location */}
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                          <MapPin className="h-3 w-3" />
                          <span>{meeting.jurisdiction?.name || 'Unknown'}</span>
                        </div>
                        
                        {/* Meeting title */}
                        <div className="font-medium text-sm mb-1">
                          {meeting.title || meeting.body_name}
                        </div>
                        
                        {/* Date & Time */}
                        {meeting.starts_at && (
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(meeting.starts_at), 'MMM d, yyyy')} • {format(new Date(meeting.starts_at), 'h:mm a')}
                          </div>
                        )}
                      </Link>
                    ))}
                    
                    <Button variant="link" asChild className="w-full mt-4">
                      <Link to="/browse/meetings">
                        View All Meetings →
                      </Link>
                    </Button>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No meetings scheduled
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Calendar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Calendar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CalendarComponent variant="dashboard" />
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row - Full Width Recent Updates */}
        <CollapsibleSection
          storageKey="recent-updates"
          title="Recent Updates"
          icon={<Scale className="h-5 w-5 text-primary" />}
          badge={recentLegislation.length > 0 && <Badge variant="secondary">{recentLegislation.length}</Badge>}
        >
          <div className="space-y-4">
            {recentLegislation.length > 0 ? (
              <>
                {recentLegislation.map((item: any) => (
                  <Link
                    key={item.id}
                    to={`/legislation/${item.id}`}
                    className="block border-b border-border pb-4 last:border-0 hover:bg-accent p-3 -mx-3 rounded transition-colors"
                  >
                    {/* Title (one line, truncated if needed) */}
                    <h3 className="font-medium text-base truncate mb-2">
                      {item.title}
                    </h3>
                    
                    {/* Metadata line: Location + Date */}
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>{item.jurisdiction?.name || 'Unknown'}</span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {item.introduced_at 
                            ? format(new Date(item.introduced_at), 'MMM d, yyyy')
                            : item.created_at 
                            ? format(new Date(item.created_at), 'MMM d, yyyy')
                            : 'Date unknown'}
                        </span>
                      </div>
                    </div>

                    {/* Optional: Short description (1-2 lines) */}
                    {item.summary && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {item.summary}
                      </p>
                    )}
                  </Link>
                ))}
                
                <Button variant="link" asChild className="w-full mt-4">
                  <Link to="/browse/legislation">
                    Browse All Legislation →
                  </Link>
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No recent updates
              </p>
            )}
          </div>
        </CollapsibleSection>
      </div>
    </Layout>
  );
}
