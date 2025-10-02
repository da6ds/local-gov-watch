import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Calendar, FileText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { StatusBadge } from "@/components/StatusBadge";
import { TagChips } from "@/components/TagChips";
import { Skeleton } from "@/components/ui/skeleton";
import { getGuestScope, getGuestTopics } from "@/lib/guestSessionStorage";

export default function BrowseLegislation() {
  const [searchTerm, setSearchTerm] = useState("");
  const [jurisdictionIds, setJurisdictionIds] = useState<string[]>([]);
  const topicsParam = getGuestTopics().join(',');

  // Resolve jurisdiction IDs
  useEffect(() => {
    const fetchIds = async () => {
      const guestScope = getGuestScope();
      const { data } = await supabase
        .from('jurisdiction')
        .select('id')
        .in('slug', guestScope);
      
      if (data) {
        setJurisdictionIds(data.map(j => j.id));
      }
    };
    fetchIds();
  }, []);

  const { data: legislation, isLoading } = useQuery({
    queryKey: ['legislation', jurisdictionIds, searchTerm, topicsParam],
    queryFn: async () => {
      let query = supabase
        .from('legislation')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (jurisdictionIds.length > 0) {
        query = query.in('jurisdiction_id', jurisdictionIds);
      }

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,summary.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Filter by topics if present
      if (topicsParam && data) {
        const topics = topicsParam.split(',').filter(Boolean);
        if (topics.length > 0) {
          const { data: topicData } = await supabase
            .from('item_topic')
            .select('item_id')
            .eq('item_type', 'legislation')
            .in('topic', topics);
          
          if (topicData) {
            const topicItemIds = new Set(topicData.map(t => t.item_id));
            return data.filter(item => topicItemIds.has(item.id));
          }
        }
      }

      return data;
    },
    enabled: jurisdictionIds.length > 0,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Legislation</h1>
          <p className="text-muted-foreground">Track bills, ordinances, and resolutions</p>
        </div>

        <Card className="p-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search legislation..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button type="submit">Search</Button>
          </form>
        </Card>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-4" />
                <Skeleton className="h-4 w-1/2" />
              </Card>
            ))}
          </div>
        ) : legislation && legislation.length > 0 ? (
          <div className="space-y-4">
            {legislation.map((item) => (
              <Link key={item.id} to={`/legislation/${item.id}`}>
                <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-1">{item.title}</h3>
                      {item.summary && (
                        <p className="text-muted-foreground text-sm line-clamp-2">
                          {item.summary}
                        </p>
                      )}
                    </div>
                    <StatusBadge status={item.status || 'unknown'} />
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                    {item.introduced_at && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>Introduced {format(new Date(item.introduced_at), 'MMM d, yyyy')}</span>
                      </div>
                    )}
                    {item.passed_at && (
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        <span>Passed {format(new Date(item.passed_at), 'MMM d, yyyy')}</span>
                      </div>
                    )}
                  </div>

                  {item.tags && item.tags.length > 0 && (
                    <TagChips tags={item.tags} />
                  )}
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              {searchTerm || topicsParam ? 'No legislation found matching your filters.' : 'No legislation data available yet.'}
            </p>
            {!searchTerm && !topicsParam && (
              <p className="text-sm text-muted-foreground mt-2">
                Check back soon for updates.
              </p>
            )}
          </Card>
        )}
      </div>
    </Layout>
  );
}
