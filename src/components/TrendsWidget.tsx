import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

export function TrendsWidget() {
  const { data: trends, isLoading } = useQuery({
    queryKey: ['dashboard-trends'],
    queryFn: async () => {
      // Get Travis County by default for MVP
      const { data: county } = await supabase
        .from('jurisdiction')
        .select('id, name')
        .eq('slug', 'travis-county-tx')
        .single();

      if (!county) return { county: null, trends: [] };

      const weekStart = new Date();
      const dayOfWeek = weekStart.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      weekStart.setDate(weekStart.getDate() - daysToMonday);

      const { data, error } = await supabase
        .from('topic_trend')
        .select('*')
        .eq('county_id', county.id)
        .eq('week_start', weekStart.toISOString().split('T')[0])
        .order('item_count', { ascending: false })
        .limit(3);

      if (error) throw error;
      return { county, trends: data || [] };
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            This Week's Trends
          </CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-center py-6">
          Loading trends...
        </CardContent>
      </Card>
    );
  }

  if (!trends?.trends.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            This Week's Trends
          </CardTitle>
          <CardDescription>
            {trends?.county ? `in ${trends.county.name}` : ''}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground text-center py-6">
          No trends yet this week
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          This Week's Trends
        </CardTitle>
        <CardDescription>
          {trends.county ? `in ${trends.county.name}` : ''}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {trends.trends.map((trend) => (
          <div key={trend.id} className="border-l-2 border-accent pl-4">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="secondary" className="bg-accent/20 text-accent-foreground">
                {trend.tag.toUpperCase()}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {trend.item_count} {trend.item_count === 1 ? 'item' : 'items'}
              </span>
            </div>
            {trend.cluster_label && (
              <p className="font-medium text-sm mb-1">{trend.cluster_label}</p>
            )}
            {trend.ai_summary && (
              <p className="text-sm text-muted-foreground mb-2">{trend.ai_summary}</p>
            )}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>{trend.cities.join(', ')}</span>
            </div>
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
