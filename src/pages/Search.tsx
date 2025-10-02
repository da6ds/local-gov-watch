import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Loader2, FileText, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

interface SearchResult {
  id: string;
  type: 'legislation' | 'meeting';
  title: string;
  snippet: string;
  jurisdiction: string;
  jurisdictionSlug: string;
  date: string;
  url: string;
  status?: string;
  bodyName?: string;
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [typeFilter, setTypeFilter] = useState<'all' | 'legislation' | 'meeting'>('all');

  useEffect(() => {
    const query = searchParams.get('q');
    if (query) {
      setSearchQuery(query);
    }
  }, [searchParams]);

  const { data: searchData, isLoading } = useQuery({
    queryKey: ['search', searchQuery, typeFilter],
    queryFn: async () => {
      if (!searchQuery || searchQuery.trim().length === 0) {
        return { results: [], total: 0, query: '' };
      }

      const { data, error } = await supabase.functions.invoke('search', {
        body: {
          query: searchQuery,
          type: typeFilter,
          limit: 20
        }
      });

      if (error) throw error;
      return data || { results: [], total: 0, query: '' };
    },
    enabled: searchQuery.length > 0,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchParams({ q: searchQuery });
    }
  };

  const results = (searchData?.results || []) as SearchResult[];
  const total = searchData?.total || 0;

  return (
    <Layout>
      <Helmet>
        <title>Search - Local Gov Watch</title>
        <meta name="description" content="Search legislation and meetings" />
      </Helmet>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Search Header */}
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">Search</h1>
          
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search legislation, meetings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 text-lg h-12"
              autoFocus
            />
          </form>

          {/* Type Filter */}
          <Tabs value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="legislation">
                <FileText className="h-4 w-4 mr-2" />
                Legislation
              </TabsTrigger>
              <TabsTrigger value="meeting">
                <Calendar className="h-4 w-4 mr-2" />
                Meetings
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Results Count */}
        {searchQuery && !isLoading && (
          <p className="text-muted-foreground">
            Found {total} result{total !== 1 ? 's' : ''} for "{searchQuery}"
          </p>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12 gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-muted-foreground">Searching...</span>
          </div>
        )}

        {/* Results List */}
        {!isLoading && results.length > 0 && (
          <div className="space-y-4">
            {results.map((result) => (
              <Card key={result.id} className="p-4 hover:bg-muted/50 transition-colors">
                <Link to={result.url} className="block space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={result.type === 'legislation' ? 'default' : 'secondary'}>
                          {result.type === 'legislation' ? (
                            <><FileText className="h-3 w-3 mr-1" />Legislation</>
                          ) : (
                            <><Calendar className="h-3 w-3 mr-1" />Meeting</>
                          )}
                        </Badge>
                        {result.status && (
                          <Badge variant="outline" className="capitalize">
                            {result.status}
                          </Badge>
                        )}
                      </div>
                      
                      <h3 className="text-lg font-semibold hover:text-primary transition-colors line-clamp-2">
                        {result.title}
                      </h3>
                      
                      {result.snippet && (
                        <p 
                          className="text-sm text-muted-foreground line-clamp-3"
                          dangerouslySetInnerHTML={{ __html: result.snippet }}
                        />
                      )}
                      
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{result.jurisdiction}</span>
                        <span>•</span>
                        <span>{format(new Date(result.date), 'MMM d, yyyy')}</span>
                        {result.bodyName && (
                          <>
                            <span>•</span>
                            <span>{result.bodyName}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && searchQuery && results.length === 0 && (
          <Card className="p-12 text-center">
            <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No results found</h3>
            <p className="text-muted-foreground mb-4">
              Try different keywords or adjust your filters
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setTypeFilter('all');
                setSearchParams({});
              }}
            >
              Clear search
            </Button>
          </Card>
        )}

        {/* Initial State */}
        {!isLoading && !searchQuery && (
          <Card className="p-12 text-center">
            <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Start searching</h3>
            <p className="text-muted-foreground">
              Search for legislation, meetings, and more
            </p>
          </Card>
        )}
      </div>
    </Layout>
  );
}
