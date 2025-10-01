import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { ScopeSelector } from "@/components/ScopeSelector";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

export default function Trends() {
  const [scope, setScope] = useState<'city' | 'county' | 'state'>('county');
  const [selectedWeek, setSelectedWeek] = useState(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - daysToMonday);
    return weekStart.toISOString().split('T')[0];
  });

  const { data: trends, isLoading } = useQuery({
    queryKey: ['trends', scope, selectedWeek],
    queryFn: async () => {
      // Get Travis County by default for MVP
      const { data: county } = await supabase
        .from('jurisdiction')
        .select('id')
        .eq('slug', 'travis-county-tx')
        .single();

      if (!county) return [];

      const { data, error } = await supabase
        .from('topic_trend')
        .select('*')
        .eq('county_id', county.id)
        .eq('week_start', selectedWeek)
        .order('item_count', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Weekly Trends</h1>
              <p className="text-muted-foreground">
                What's happening in local government this week
              </p>
            </div>
            <ScopeSelector value={scope} onChange={setScope} />
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
                  Trends will appear here once we analyze this week's content
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
                          <Badge variant="secondary" className="bg-accent text-accent-foreground">
                            {trend.tag.toUpperCase()}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {trend.item_count} {trend.item_count === 1 ? 'item' : 'items'}
                          </span>
                        </div>
                        <CardTitle className="text-xl">
                          {trend.cluster_label || `${trend.tag} activity`}
                        </CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {trend.ai_summary && (
                      <p className="text-muted-foreground mb-4">{trend.ai_summary}</p>
                    )}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{trend.cities.join(', ')}</span>
                    </div>
                    <Link
                      to={`/browse/legislation?tag=${trend.tag}`}
                      className="inline-block mt-4 text-primary hover:underline font-medium"
                    >
                      View related items →
                    </Link>
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
