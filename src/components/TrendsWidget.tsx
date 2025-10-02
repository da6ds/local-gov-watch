import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { getGuestScope } from "@/lib/guestSessionStorage";

export function TrendsWidget() {
  const { data: trends, isLoading } = useQuery({
    queryKey: ['dashboard-trends', getGuestScope()],
    queryFn: async () => {
      const scopes = getGuestScope();
      if (!scopes.length) return [];

      // Get jurisdictions for the selected scopes
      const { data: jurisdictions } = await supabase
        .from('jurisdiction')
        .select('id, name')
        .in('slug', scopes);

      if (!jurisdictions?.length) return [];

      const jurisdictionIds = jurisdictions.map(j => j.id);

      // Get trends for 7-day window
      const { data, error } = await supabase
        .from('topic_trend')
        .select('*')
        .in('jurisdiction_id', jurisdictionIds)
        .eq('time_window', '7d')
        .order('item_count', { ascending: false })
        .limit(4);

      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Trends
          </CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-center py-6">
          Loading trends...
        </CardContent>
      </Card>
    );
  }

  if (!trends?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Trends
          </CardTitle>
          <CardDescription>Last 7 days</CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground text-center py-6">
          No trends available yet
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Trends
        </CardTitle>
        <CardDescription>Last 7 days</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {trends.map((trend) => (
          <div key={trend.id} className="border-l-2 border-accent pl-4">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="secondary" className="bg-accent/20 text-accent-foreground capitalize">
                {trend.topic.replace(/-/g, ' ')}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {trend.item_count} {trend.item_count === 1 ? 'item' : 'items'}
              </span>
            </div>
            {trend.ai_summary && (
              <p className="text-sm text-muted-foreground line-clamp-2">{trend.ai_summary}</p>
            )}
          </div>
        ))}
        <Link
          to="/browse/trends"
          className="inline-block text-sm text-primary hover:underline font-medium"
        >
          View all trends →
        </Link>
      </CardContent>
    </Card>
  );
}
