import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { TrendingUp, Calendar, FileText, Bookmark, Bell, Sparkles, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, addDays, formatDistanceToNow } from "date-fns";
import { GuestBanner } from "@/components/GuestBanner";
import { TrendsPlaceholder } from "@/components/TrendsPlaceholder";

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

  // Fetch recent legislation (last 7 days)
  const { data: recentLegislation } = useQuery({
    queryKey: ['recent-legislation', effectiveJurisdictionId],
    queryFn: async () => {
      const sevenDaysAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd');
      const { data } = await supabase
        .from('legislation')
        .select('*')
        .eq('jurisdiction_id', effectiveJurisdictionId)
        .gte('created_at', sevenDaysAgo)
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!effectiveJurisdictionId
  });

  // Fetch upcoming meetings (next 14 days)
  const { data: upcomingMeetings } = useQuery({
    queryKey: ['upcoming-meetings', effectiveJurisdictionId],
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const twoWeeksLater = format(addDays(new Date(), 14), 'yyyy-MM-dd');
      const { data } = await supabase
        .from('meeting')
        .select('*')
        .eq('jurisdiction_id', effectiveJurisdictionId)
        .gte('starts_at', today)
        .lte('starts_at', twoWeeksLater)
        .order('starts_at', { ascending: true })
        .limit(5);
      return data || [];
    },
    enabled: !!effectiveJurisdictionId
  });

  // Fetch upcoming elections (next 90 days)
  const { data: upcomingElections } = useQuery({
    queryKey: ['upcoming-elections', effectiveJurisdictionId],
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const ninetyDaysLater = format(addDays(new Date(), 90), 'yyyy-MM-dd');
      const { data } = await supabase
        .from('election')
        .select('*')
        .eq('jurisdiction_id', effectiveJurisdictionId)
        .gte('date', today)
        .lte('date', ninetyDaysLater)
        .order('date', { ascending: true })
        .limit(3);
      return data || [];
    },
    enabled: !!effectiveJurisdictionId
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
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">
              {jurisdiction?.name || 'Select a jurisdiction in settings'}
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/settings">
              <Bell className="h-4 w-4 mr-2" />
              Settings
            </Link>
          </Button>
        </div>

        {/* Snapshot Cards - Zero-click data access */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="civic-card">
            <CardHeader>
              <TrendingUp className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Recent Updates</CardTitle>
              <CardDescription>New legislation this week</CardDescription>
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

        {/* Live Data Status */}
        {latestConnectorRun?.last_run_at && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <span>
              Live data as of {formatDistanceToNow(new Date(latestConnectorRun.last_run_at), { addSuffix: true })}
            </span>
            {profile?.is_admin && (
              <>
                <span>•</span>
                <Link to="/admin/connectors" className="text-primary hover:underline flex items-center gap-1">
                  <RefreshCw className="h-3 w-3" />
                  Manage connectors
                </Link>
              </>
            )}
          </div>
        )}

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
              <div className="flex flex-wrap gap-2 mb-4">
                {userTopics.map(topic => (
                  <Badge key={topic} variant="secondary" className="text-sm capitalize">
                    {topic.replace(/-/g, ' ')}
                  </Badge>
                ))}
              </div>
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  asChild={!isGuest}
                  disabled={isGuest}
                >
                  {isGuest ? (
                    <div className="w-full">
                      <Bookmark className="h-4 w-4 mr-2" />
                      Save to Watchlist (Create account)
                    </div>
                  ) : (
                    <Link to="/browse/legislation">
                      <Bookmark className="h-4 w-4 mr-2" />
                      Save to Watchlist
                    </Link>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  asChild={!isGuest}
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
            </CardContent>
          </Card>
        )}

        {/* Trends - Show placeholder for guest mode */}
        {isGuest ? (
          <TrendsPlaceholder />
        ) : (
          <Card className="border-dashed">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="h-8 w-8 text-accent" />
                <div className="flex-1">
                  <CardTitle>Emerging Trends</CardTitle>
                  <CardDescription>AI-powered insights across multiple jurisdictions</CardDescription>
                </div>
                <Badge variant="secondary">Coming Soon</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Soon you'll see patterns like "Multiple cities in your area are considering tax changes" 
                with aggregated insights and cross-jurisdictional analysis.
              </p>
              <Button variant="outline" asChild>
                <Link to="/browse/trends">Preview Trends →</Link>
              </Button>
            </CardContent>
          </Card>
        )}
        </div>
      </Layout>
    </>
  );
}