import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp } from "lucide-react";
import { getGuestScope, getGuestTopics } from "@/lib/guestSessionStorage";

export default function Trends() {
  const [timeWindow, setTimeWindow] = useState<'7d' | '30d' | '180d' | '365d'>('7d');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  useEffect(() => {
    setSelectedTopics(getGuestTopics());
  }, []);

  const { data: trends, isLoading } = useQuery({
    queryKey: ['trends', timeWindow, getGuestScope(), selectedTopics],
    queryFn: async () => {
      const scopes = getGuestScope();
      if (!scopes.length) return [];

      const { data: jurisdictions } = await supabase
        .from('jurisdiction')
        .select('id, name')
        .in('slug', scopes);

      if (!jurisdictions?.length) return [];

      const jurisdictionIds = jurisdictions.map(j => j.id);

      const { data: allTrends } = await supabase
        .from('topic_trend')
        .select('*')
        .in('jurisdiction_id', jurisdictionIds)
        .eq('time_window', timeWindow)
        .order('item_count', { ascending: false })
        .limit(20);

      if (!allTrends) return [];

      // Prioritize selected topics
      if (selectedTopics.length > 0) {
        const matching = allTrends.filter(t => selectedTopics.includes(t.topic));
        const others = allTrends.filter(t => !selectedTopics.includes(t.topic));
        return [...matching, ...others];
      }

      return allTrends;
    },
  });

  const windowLabels = {
    '7d': '7 days',
    '30d': '30 days',
    '180d': '6 months',
    '365d': '1 year'
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Trends</h1>
              <p className="text-muted-foreground">
                What's happening in your selected locations
                {selectedTopics.length > 0 && ` • Filtered by ${selectedTopics.length} topic${selectedTopics.length > 1 ? 's' : ''}`}
              </p>
            </div>
            
            <div className="flex gap-2 flex-wrap">
              {(['7d', '30d', '180d', '365d'] as const).map((window) => (
                <Button
                  key={window}
                  variant={timeWindow === window ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeWindow(window)}
                >
                  {windowLabels[window]}
                </Button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              Loading trends...
            </div>
          ) : trends?.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No trends yet</h3>
                <p className="text-muted-foreground">
                  Trends will appear here once we analyze content for this time period
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {trends?.map((trend) => (
                <Card key={trend.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary" className="bg-accent/20 text-accent-foreground capitalize">
                            {trend.topic.replace(/-/g, ' ')}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {trend.item_count} {trend.item_count === 1 ? 'item' : 'items'}
                          </span>
                        </div>
                        <CardTitle className="text-xl capitalize">
                          {trend.topic.replace(/-/g, ' ')} Activity
                        </CardTitle>
                        {trend.ai_summary && (
                          <CardDescription className="mt-2">
                            {trend.ai_summary}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2 text-sm text-muted-foreground">
                      <span>{trend.meeting_count || 0} meetings</span>
                      <span>•</span>
                      <span>{trend.legislation_count || 0} legislation</span>
                      <span>•</span>
                      <span>{trend.election_count || 0} elections</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
