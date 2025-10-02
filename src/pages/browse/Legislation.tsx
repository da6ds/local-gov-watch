import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Calendar, FileText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { StatusBadge } from "@/components/StatusBadge";
import { TagChips } from "@/components/TagChips";
import { Skeleton } from "@/components/ui/skeleton";

export default function BrowseLegislation() {
  const { user, guestSession } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  // Get jurisdiction ID (from user or guest session)
  const jurisdictionId = user 
    ? undefined // Will use user's selected jurisdiction from profile
    : "1e42532f-a7f2-44cc-ba2b-59422c79d47f"; // Austin for guests

  const { data: legislation, isLoading } = useQuery({
    queryKey: ['legislation', jurisdictionId, searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('legislation')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (jurisdictionId) {
        query = query.eq('jurisdiction_id', jurisdictionId);
      }

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,summary.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
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
              {searchTerm ? 'No legislation found matching your search.' : 'No legislation data available yet.'}
            </p>
            {!searchTerm && (
              <p className="text-sm text-muted-foreground mt-2">
                Check back soon for updates from Austin, TX.
              </p>
            )}
          </Card>
        )}
      </div>
    </Layout>
  );
}