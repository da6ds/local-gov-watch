import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Link } from "react-router-dom";
import { TrendingUp, Calendar, FileText, Tag, Bell, AlertCircle, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, formatDistanceToNow } from "date-fns";
import { TrendsPlaceholder } from "@/components/TrendsPlaceholder";
import { useDataStatus } from "@/hooks/useDataStatus";
import { resolveScope } from "@/lib/scopeResolver";
import { DataHealthDrawer } from "@/components/DataHealthDrawer";
import { RefreshDataButton } from "@/components/RefreshDataButton";
import { useGuestRunUpdate } from "@/hooks/useGuestRunUpdate";
import { toast } from "sonner";
import React, { useState, useEffect } from "react";
import { LocationSelector } from "@/components/LocationSelector";
import { MiniCalendar } from "@/components/MiniCalendar";
import { getGuestScope, setGuestScope, getGuestTopics, setGuestTopics } from "@/lib/guestSessionStorage";
import { InteractiveTopicChips } from "@/components/InteractiveTopicChips";
import { useTopics } from "@/hooks/useTopics";

export default function Dashboard() {
  const queryClient = useQueryClient();
  const { isGuest, guestSession } = useAuth();
  const { data: availableTopics = [] } = useTopics();
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedJurisdictions, setSelectedJurisdictions] = useState<string[]>([]);
  const [scopeString, setScopeString] = useState<string>('');
  const [jurisdictionIds, setJurisdictionIds] = useState<string[]>([]);
  const runUpdate = useGuestRunUpdate();
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);
  const [autoRefreshEta, setAutoRefreshEta] = useState<number | null>(null);

  // Initialize and manage selected jurisdictions and topics from guest session
  useEffect(() => {
    const guestScope = getGuestScope();
    const guestTopics = getGuestTopics();
    setSelectedJurisdictions(guestScope);
    setScopeString(guestScope.join(','));
    setSelectedTopics(guestTopics);
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

  // Handle topic toggle
  const toggleTopic = (slug: string) => {
    const updated = selectedTopics.includes(slug)
      ? selectedTopics.filter(t => t !== slug)
      : [...selectedTopics, slug];
    
    setSelectedTopics(updated);
    setGuestTopics(updated);
    
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['calendar'] });
    queryClient.invalidateQueries({ queryKey: ['browse'] });
    queryClient.invalidateQueries({ queryKey: ['trends'] });
    
    toast.success("Topics updated");
  };

  const clearTopics = () => {
    setSelectedTopics([]);
    setGuestTopics([]);
    
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['calendar'] });
    queryClient.invalidateQueries({ queryKey: ['browse'] });
    queryClient.invalidateQueries({ queryKey: ['trends'] });
    
    toast.success("Topics cleared");
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

  // Fetch data using dashboard API with topic filtering
  const topicsParam = selectedTopics.join(',');
  
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
        <div className="space-y-6">
          {/* Header with jurisdiction and status line */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold">Dashboard</h1>
              {/* Subtle status line under title */}
              <div className="text-sm text-muted-foreground mt-1" aria-live="polite">
                {isAutoRefreshing ? (
                  <span>Updating... ~{Math.round((autoRefreshEta || 120000) / 1000 / 60)}m remaining</span>
                ) : dataStatus?.mode === 'live' && dataStatus.lastRunAt ? (
                  <span>Live as of {formatDistanceToNow(new Date(dataStatus.lastRunAt), { addSuffix: true })}</span>
                ) : dataStatus?.mode === 'seed' && dataStatus.reason === 'no-successful-runs' && 
                   (dataStatus.tableCounts.meetings + dataStatus.tableCounts.legislation + dataStatus.tableCounts.elections === 0) ? (
                  <span>No recent local updates yet</span>
                ) : null}
              </div>
              <div className="mt-4">
                <LocationSelector 
                  value={selectedJurisdictions}
                  onChange={handleJurisdictionChange}
                  maxSelections={3}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <RefreshDataButton 
                scope={scopeString}
                sessionId={(guestSession as any)?.session_id || (typeof guestSession === 'string' ? guestSession : undefined)}
              />
              <Button asChild variant="outline">
                <Link to="/settings">
                  <Bell className="h-4 w-4 mr-2" />
                  Settings
                </Link>
              </Button>
            </div>
          </div>

            {/* Topic Filter Indicator */}
            {selectedTopics.length > 0 && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-6 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      Filtering by {selectedTopics.length} topic{selectedTopics.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={clearTopics}>
                    Clear
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Snapshot Cards */}
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <TrendingUp className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Recent Updates</CardTitle>
                  <CardDescription>New legislation</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold mb-2">{recentLegislation.length}</p>
                  {recentLegislation.length > 0 ? (
                    <div className="space-y-2 mb-3">
                      {recentLegislation.slice(0, 3).map((item: any) => (
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
                    <p className="text-sm text-muted-foreground mb-3">No recent updates</p>
                  )}
                  <Button variant="link" asChild className="p-0 h-auto">
                    <Link to="/browse/legislation">View all →</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Calendar className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Upcoming Meetings</CardTitle>
                  <CardDescription>Next 14 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold mb-2">{upcomingMeetings.length}</p>
                  {upcomingMeetings.length > 0 ? (
                    <div className="space-y-2 mb-3">
                      {upcomingMeetings.slice(0, 3).map((meeting: any) => (
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
                  <Button variant="link" asChild className="p-0 h-auto">
                    <Link to="/calendar">View calendar →</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <FileText className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Upcoming Elections</CardTitle>
                  <CardDescription>Next 90 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold mb-2">{upcomingElections.length}</p>
                  {upcomingElections.length > 0 ? (
                    <div className="space-y-2 mb-3">
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

            {/* Bottom Grid: Your Topics + Calendar + Trends */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Your Topics Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Your Topics
                  </CardTitle>
                  <CardDescription>
                    Click topics to filter all data
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <InteractiveTopicChips
                    topics={availableTopics}
                    selectedTopics={selectedTopics}
                    onToggle={toggleTopic}
                    onClear={clearTopics}
                    showClear={true}
                  />
                  {selectedTopics.length > 0 && (
                    <div className="text-sm text-muted-foreground pt-2 border-t">
                      Filtering by {selectedTopics.length} topic{selectedTopics.length > 1 ? 's' : ''}
                    </div>
                  )}
                  <div className="space-y-2 pt-4 border-t">
                    <Link to="/settings">
                      <Button variant="outline" className="w-full justify-start">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Trends Card */}
              <Card className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Trends
                </h3>
                <TrendsPlaceholder />
              </Card>
            </div>

            <MiniCalendar scope={scopeString || 'austin-tx,travis-county-tx,texas'} />
          </div>
        </Layout>
      </TooltipProvider>
    );
}
