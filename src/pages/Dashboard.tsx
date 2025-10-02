import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Link } from "react-router-dom";
import { TrendingUp, Calendar, FileText, Bookmark, Bell, Sparkles, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, addDays, formatDistanceToNow } from "date-fns";
import { GuestBanner } from "@/components/GuestBanner";
import { TrendsPlaceholder } from "@/components/TrendsPlaceholder";
import { useDataStatus } from "@/hooks/useDataStatus";
import { resolveScope, type ResolvedScope } from "@/lib/scopeResolver";
import { DataHealthDrawer } from "@/components/DataHealthDrawer";
import { RefreshDataButton } from "@/components/RefreshDataButton";
import { useGuestRunUpdate } from "@/hooks/useGuestRunUpdate";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import React, { useState, useEffect } from "react";
import { LocationSelector } from "@/components/LocationSelector";
import { MiniCalendar } from "@/components/MiniCalendar";
import { getGuestScope, setGuestScope } from "@/lib/guestSessionStorage";

export default function Dashboard() {
  const { user, isGuest, guestSession } = useAuth();

  // Fetch user profile for scope (or use guest session)
  const { data: profile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('profile')
        .select('*')
        .eq('id', user.id)
        .single();
      return data;
    },
    enabled: !!user && !isGuest
  });

  // Use guest jurisdiction if in guest mode
  const effectiveJurisdictionId = isGuest 
    ? guestSession?.selectedJurisdictionId 
    : profile?.selected_jurisdiction_id;

  // Fetch jurisdiction separately
  const { data: jurisdiction } = useQuery({
    queryKey: ['jurisdiction', effectiveJurisdictionId],
    queryFn: async () => {
      if (!effectiveJurisdictionId) return null;
      const { data } = await supabase
        .from('jurisdiction')
        .select('*')
        .eq('id', effectiveJurisdictionId)
        .single();
      return data;
    },
    enabled: !!effectiveJurisdictionId
  });

  // Resolve scope using guest session storage or user profile
  const [selectedJurisdictions, setSelectedJurisdictions] = useState<string[]>([]);
  const [scopeString, setScopeString] = useState<string>('');
  const [resolvedScope, setResolvedScope] = useState<ResolvedScope | null>(null);
  const queryClient = useQueryClient();
  const runUpdate = useGuestRunUpdate();
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);
  const [autoRefreshEta, setAutoRefreshEta] = useState<number | null>(null);

  // Initialize selected jurisdictions from guest session storage
  useEffect(() => {
    const storedJurisdictions = getGuestScope();
    setSelectedJurisdictions(storedJurisdictions);
  }, []);

  // Update scope string when jurisdictions change
  useEffect(() => {
    if (selectedJurisdictions.length === 0) return;
    
    const buildScope = async () => {
      // Fetch jurisdiction details to build proper scope string
      const { data: jurisdictions } = await supabase
        .from('jurisdiction')
        .select('slug, type')
        .in('slug', selectedJurisdictions);
      
      if (jurisdictions) {
        const scopeParts = jurisdictions.map(j => `${j.type}:${j.slug}`);
        const newScopeString = scopeParts.join(',');
        setScopeString(newScopeString);
        setResolvedScope({
          scopeString: newScopeString,
          jurisdictionIds: [],
          jurisdictionSlugs: selectedJurisdictions
        });
      }
    };
    
    buildScope();
  }, [selectedJurisdictions]);

  const handleJurisdictionChange = (slugs: string[]) => {
    setSelectedJurisdictions(slugs);
    setGuestScope(slugs);
    
    // Invalidate all data queries to refetch with new scope
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['calendar'] });
    queryClient.invalidateQueries({ queryKey: ['legislation'] });
    queryClient.invalidateQueries({ queryKey: ['meetings'] });
    queryClient.invalidateQueries({ queryKey: ['elections'] });
    queryClient.invalidateQueries({ queryKey: ['data-status'] });
  };

  // Check data status with unified scope
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
        queryClient.invalidateQueries({ queryKey: ['recent-legislation'] });
        queryClient.invalidateQueries({ queryKey: ['upcoming-meetings'] });
        queryClient.invalidateQueries({ queryKey: ['upcoming-elections'] });
        toast.success("Local data loaded!");
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoRefreshing, refetchDataStatus, queryClient]);

  // Fetch recent legislation (last 7 days) - use resolved jurisdiction IDs
  const { data: recentLegislation } = useQuery({
    queryKey: ['recent-legislation', resolvedScope?.jurisdictionIds],
    queryFn: async () => {
      if (!resolvedScope?.jurisdictionIds || resolvedScope.jurisdictionIds.length === 0) return [];
      
      const sevenDaysAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd');
      const { data } = await supabase
        .from('legislation')
        .select('*')
        .in('jurisdiction_id', resolvedScope.jurisdictionIds)
        .gte('created_at', sevenDaysAgo)
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!resolvedScope?.jurisdictionIds && resolvedScope.jurisdictionIds.length > 0 && !isAutoRefreshing
  });

  // Fetch upcoming meetings (next 14 days) - use resolved jurisdiction IDs
  const { data: upcomingMeetings } = useQuery({
    queryKey: ['upcoming-meetings', resolvedScope?.jurisdictionIds],
    queryFn: async () => {
      if (!resolvedScope?.jurisdictionIds || resolvedScope.jurisdictionIds.length === 0) return [];
      
      const today = format(new Date(), 'yyyy-MM-dd');
      const twoWeeksLater = format(addDays(new Date(), 14), 'yyyy-MM-dd');
      const { data } = await supabase
        .from('meeting')
        .select('*')
        .in('jurisdiction_id', resolvedScope.jurisdictionIds)
        .gte('starts_at', today)
        .lte('starts_at', twoWeeksLater)
        .order('starts_at', { ascending: true })
        .limit(5);
      return data || [];
    },
    enabled: !!resolvedScope?.jurisdictionIds && resolvedScope.jurisdictionIds.length > 0 && !isAutoRefreshing
  });

  // Fetch upcoming elections (next 90 days) - use resolved jurisdiction IDs
  const { data: upcomingElections } = useQuery({
    queryKey: ['upcoming-elections', resolvedScope?.jurisdictionIds],
    queryFn: async () => {
      if (!resolvedScope?.jurisdictionIds || resolvedScope.jurisdictionIds.length === 0) return [];
      
      const today = format(new Date(), 'yyyy-MM-dd');
      const ninetyDaysLater = format(addDays(new Date(), 90), 'yyyy-MM-dd');
      const { data } = await supabase
        .from('election')
        .select('*')
        .in('jurisdiction_id', resolvedScope.jurisdictionIds)
        .gte('date', today)
        .lte('date', ninetyDaysLater)
        .order('date', { ascending: true })
        .limit(3);
      return data || [];
    },
    enabled: !!resolvedScope?.jurisdictionIds && resolvedScope.jurisdictionIds.length > 0 && !isAutoRefreshing
  });

  // Fetch latest connector run for this jurisdiction
  const { data: latestConnectorRun } = useQuery({
    queryKey: ['latest-connector-run', jurisdiction?.slug],
    queryFn: async () => {
      if (!jurisdiction?.slug) return null;
      
      const jurisdictionSlug = `${jurisdiction.type}:${jurisdiction.slug}`;
      
      const { data } = await supabase
        .from('connector')
        .select('last_run_at, last_status')
        .eq('jurisdiction_slug', jurisdictionSlug)
        .eq('enabled', true)
        .order('last_run_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      return data;
    },
    enabled: !!jurisdiction?.slug
  });

  // Fetch user's subscription for topics
  const { data: subscription } = useQuery({
    queryKey: ['user-subscription', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('subscription')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user
  });

  // Get topics from guest session or subscription
  const userTopics = isGuest 
    ? guestSession?.topics || []
    : subscription?.topics || [];

  return (
    <>
      {isGuest && <GuestBanner />}
      <Layout>
        <div className="space-y-6">
        {/* Header with jurisdiction */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
            <LocationSelector 
              value={selectedJurisdictions}
              onChange={handleJurisdictionChange}
              maxSelections={3}
            />
          </div>
          <div className="flex gap-2">
            {profile?.is_admin && (
              <DataHealthDrawer 
                scopeString={scopeString}
                dataStatus={dataStatus}
              />
            )}
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

        {/* Data Status Banner - only show during auto-refresh or after timeout with seed mode */}
        {!isDataStatusLoading && dataStatus && (isAutoRefreshing || dataStatus.mode === 'seed') && (
          <Card className={`mb-6 ${
            dataStatus.mode === 'live'
              ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900" 
              : "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900"
          }`} aria-live="polite">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {isAutoRefreshing ? (
                      <>
                        <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
                        <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                          Updating local data...
                        </h3>
                      </>
                    ) : dataStatus.mode === 'live' ? (
                      <>
                        <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                        <h3 className="font-semibold text-green-900 dark:text-green-100">
                          Live Data
                        </h3>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                        <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">
                          Demo Data (Seeded)
                        </h3>
                      </>
                    )}
                  </div>
                  {isAutoRefreshing ? (
                    <p className="text-sm text-muted-foreground">
                      ~{Math.round((autoRefreshEta || 120000) / 1000 / 60)}m remaining
                    </p>
                  ) : dataStatus.mode === 'live' ? (
                    <p className="text-sm text-muted-foreground">
                      Live as of {dataStatus.lastRunAt ? formatDistanceToNow(new Date(dataStatus.lastRunAt), { addSuffix: true }) : 'recently'}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {dataStatus.reason === 'no-successful-runs' && 'No recent local updates yet. Data will appear as soon as your city posts it.'}
                      {dataStatus.reason === 'tables-empty' && 'Data sources are working but no records found in the selected timeframe.'}
                      {dataStatus.reason === 'success-but-empty-window' && 'Recent updates completed but no new records in the visible window.'}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        {/* Snapshot Cards - Zero-click data access */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="civic-card">
            <CardHeader>
              <TrendingUp className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Recent Updates</CardTitle>
              <CardDescription>New legislation (last 7 days)</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold mb-2">{recentLegislation?.length || 0}</p>
              {recentLegislation && recentLegislation.length > 0 ? (
                <div className="space-y-2 mb-3">
                  {recentLegislation.slice(0, 3).map(item => (
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
                <Link to="/browse/legislation">View all legislation →</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="civic-card">
            <CardHeader>
              <Calendar className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Upcoming Meetings</CardTitle>
              <CardDescription>Next 14 days</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold mb-2">{upcomingMeetings?.length || 0}</p>
              {upcomingMeetings && upcomingMeetings.length > 0 ? (
                <div className="space-y-2 mb-3">
                  {upcomingMeetings.slice(0, 3).map(meeting => (
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

          <Card className="civic-card">
            <CardHeader>
              <FileText className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Upcoming Elections</CardTitle>
              <CardDescription>Next 90 days</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold mb-2">{upcomingElections?.length || 0}</p>
              {upcomingElections && upcomingElections.length > 0 ? (
                <div className="space-y-2 mb-3">
                  {upcomingElections.map(election => (
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
                <Link to="/browse/elections">View elections →</Link>
              </Button>
            </CardContent>
          </Card>
        </div>


        {/* Topics Card */}
        {userTopics.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Your Topics</CardTitle>
                  <CardDescription>Recent activity in areas you're following</CardDescription>
                </div>
                {!isGuest && (
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/settings">Customize</Link>
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <TooltipProvider>
                <div className="flex flex-wrap gap-2 mb-4">
                  {userTopics.map(topic => (
                    <Badge key={topic} variant="secondary" className="text-sm capitalize">
                      {topic.replace(/-/g, ' ')}
                    </Badge>
                  ))}
                </div>
                <div className="space-y-2">
                  {isGuest ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start" 
                          disabled
                        >
                          <Bookmark className="h-4 w-4 mr-2" />
                          Save to Watchlist
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Create an account to save watchlists</p>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <Button 
                      variant="outline" 
                      className="w-full justify-start" 
                      asChild
                    >
                      <Link to="/browse/legislation">
                        <Bookmark className="h-4 w-4 mr-2" />
                        Save to Watchlist
                      </Link>
                    </Button>
                  )}
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start" 
                    asChild
                  >
                    {isGuest ? (
                      <Link to="/digest-preview">
                        <Bell className="h-4 w-4 mr-2" />
                        Preview Digest
                      </Link>
                    ) : (
                      <Link to="/settings">
                        <Bell className="h-4 w-4 mr-2" />
                        Update Digest Preferences
                      </Link>
                    )}
                  </Button>
                </div>
              </TooltipProvider>
            </CardContent>
          </Card>
        )}

        {/* Calendar and Trends Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          <MiniCalendar scope={scopeString || 'austin-tx,travis-county-tx,texas'} />

          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Trends
            </h3>
            {user ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Coming soon: Topic trends and analysis
              </p>
            ) : (
              <TrendsPlaceholder />
            )}
          </Card>
        </div>
        </div>
      </Layout>
    </>
  );
}