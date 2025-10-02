import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { getGuestScope } from "@/lib/guestSessionStorage";

export function TrendsWidget() {
  const { data: trendsData, isLoading } = useQuery({
    queryKey: ['dashboard-trends', getGuestScope()],
    queryFn: async () => {
      const scopes = getGuestScope();
      if (!scopes.length) return null;

      const scopeParam = scopes.join(',');
      
      const url = new URL(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/trends-api`);
      url.searchParams.set('scope', scopeParam);
      url.searchParams.set('window', '7d');

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || ''
        }
      });

      if (!response.ok) {
        console.error('Failed to fetch trends:', await response.text());
        return null;
      }

      const data = await response.json();
      // Limit to top 4 trends for widget
      return { ...data, items: (data.items || []).slice(0, 4) };
    },
  });

  const trends = trendsData?.items || [];

  if (isLoading) {
    return (
      <div className="text-muted-foreground text-center py-6">
        Loading trends...
      </div>
    );
  }

  if (!trends?.length) {
    return (
      <div className="text-muted-foreground text-center py-6">
        No trends available yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {trends.map((trend: any, index: number) => (
        <div key={`${trend.topic}-${index}`} className="border-l-2 border-accent pl-4">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="secondary" className="bg-accent/20 text-accent-foreground capitalize">
              {trend.topic.replace(/-/g, ' ')}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {trend.count} {trend.count === 1 ? 'item' : 'items'}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {trend.by_kind?.meeting || 0} meetings • {trend.by_kind?.legislation || 0} legislation • {trend.by_kind?.election || 0} elections
          </p>
        </div>
      ))}
      <Link
        to="/browse/trends"
        className="inline-block text-sm text-primary hover:underline font-medium"
      >
        View all trends →
      </Link>
    </div>
  );
}
