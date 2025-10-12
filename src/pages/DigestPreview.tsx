import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Mail, Calendar, FileText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, addDays } from "date-fns";
import { useAuth } from "@/hooks/useAuth";

export default function DigestPreview() {
  const { guestSession } = useAuth();

  // Fetch recent legislation from Austin
  const { data: recentLegislation } = useQuery({
    queryKey: ['preview-legislation'],
    queryFn: async () => {
      const sevenDaysAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd');
      const { data: jurisdiction } = await supabase
        .from('jurisdiction')
        .select('id')
        .eq('slug', 'austin-tx')
        .eq('type', 'city')
        .single();
      
      if (!jurisdiction) return [];
      
      // Filter by created_at (new to database) but sort by introduced_at (actual legislation date)
      const { data } = await supabase
        .from('legislation')
        .select('*')
        .eq('jurisdiction_id', jurisdiction.id)
        .gte('created_at', sevenDaysAgo)
        .order('introduced_at', { ascending: false })
        .limit(3);
      return data || [];
    }
  });

  // Fetch upcoming meetings
  const { data: upcomingMeetings } = useQuery({
    queryKey: ['preview-meetings'],
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const twoWeeksLater = format(addDays(new Date(), 14), 'yyyy-MM-dd');
      const { data: jurisdiction } = await supabase
        .from('jurisdiction')
        .select('id')
        .eq('slug', 'austin-tx')
        .eq('type', 'city')
        .single();
      
      if (!jurisdiction) return [];
      
      const { data } = await supabase
        .from('meeting')
        .select('*')
        .eq('jurisdiction_id', jurisdiction.id)
        .gte('starts_at', today)
        .lte('starts_at', twoWeeksLater)
        .order('starts_at', { ascending: true })
        .limit(3);
      return data || [];
    }
  });

  const weekStart = format(subDays(new Date(), new Date().getDay()), 'MMMM d, yyyy');

  return (
    <Layout>
      <div className="container max-w-3xl mx-auto py-12 px-4">
        <div className="space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold">Preview Your Weekly Digest</h1>
              <p className="text-muted-foreground">
                This is what you'd receive via email every week
              </p>
            </div>

            <Card className="border-primary/20">
              <CardHeader className="bg-primary/5">
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Weekly Austin Civic Digest
                </CardTitle>
                <CardDescription>Week of {weekStart}</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    New Legislation ({recentLegislation?.length || 0} items)
                  </h3>
                  {recentLegislation && recentLegislation.length > 0 ? (
                    <div className="space-y-3">
                      {recentLegislation.map(item => (
                        <div key={item.id} className="pl-6 border-l-2 border-primary/20">
                          <p className="font-medium text-sm line-clamp-1">{item.title}</p>
                          {item.ai_summary && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                              {item.ai_summary}
                            </p>
                          )}
                          {item.tags && item.tags.length > 0 && (
                            <div className="flex gap-2 mt-2 flex-wrap">
                              {item.tags.slice(0, 3).map(tag => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground pl-6 border-l-2 border-primary/20">
                      No new legislation this week
                    </p>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Upcoming Meetings ({upcomingMeetings?.length || 0} items)
                  </h3>
                  {upcomingMeetings && upcomingMeetings.length > 0 ? (
                    <div className="space-y-3">
                      {upcomingMeetings.map(meeting => (
                        <div key={meeting.id} className="pl-6 border-l-2 border-primary/20">
                          <p className="font-medium text-sm line-clamp-1">
                            {meeting.title || meeting.body_name}
                          </p>
                          {meeting.starts_at && (
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(meeting.starts_at), 'EEEE, MMMM d, yyyy \'at\' h:mm a')}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground pl-6 border-l-2 border-primary/20">
                      No upcoming meetings scheduled
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    Create an account to receive real digests based on your topics and preferences
                  </p>
                  <Button asChild>
                    <Link to="/auth?convert=true">Enable Email Alerts</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="text-center">
              <Button variant="outline" asChild>
                <Link to="/dashboard">Back to Dashboard</Link>
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
}
