import { Layout } from "@/components/Layout";
import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, User, MapPin, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/StatusBadge";
import { TagChips } from "@/components/TagChips";
import { getGuestScope, getGuestTopics } from "@/lib/guestSessionStorage";
import { StatusFilter } from "@/components/filters/StatusFilter";
import { format } from "date-fns";
import { LegislationFilters } from "@/components/LegislationFilters";
import { useLegislationFilters } from "@/hooks/useLegislationFilters";
import { sortLegislation } from "@/lib/legislationSorting";
import { filterLegislation, getAvailableFilters } from "@/lib/legislationFiltering";
import { useTrackedTermsFilter } from "@/hooks/useTrackedTermsFilter";
import { filterLegislationByTrackedTerms } from "@/lib/trackedTermsFiltering";

export default function BrowseLegislation() {
  const [searchTerm, setSearchTerm] = useState("");
  const [jurisdictionIds, setJurisdictionIds] = useState<string[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const statusParam = searchParams.get("status") || "all";
  const { filters, setFilters } = useLegislationFilters();
  const { activeKeywords, hasActiveFilters: hasTrackedTermsFilter, activeTerms } = useTrackedTermsFilter();

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
    queryKey: ['browse', 'legislation', jurisdictionIds, searchTerm, statusParam],
    queryFn: async () => {
      const topicIds = getGuestTopics();

      let query = supabase
        .from('legislation')
        .select('*')
        .in('jurisdiction_id', jurisdictionIds);

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,summary.ilike.%${searchTerm}%`);
      }

      // Note: Topic filtering temporarily simplified to avoid TS type recursion

      // Don't filter by status here - we'll do it in the client-side filtering

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching legislation:', error);
        throw error;
      }

      return data || [];
    },
    enabled: jurisdictionIds.length > 0,
  });

  // Calculate available filter options from fetched data
  const availableFilters = useMemo(() => {
    if (!legislation) return { authors: [], districts: [], cities: [], statuses: [] };
    return getAvailableFilters(legislation);
  }, [legislation]);

  // Apply filters and sorting client-side
  const processedLegislation = useMemo(() => {
    if (!legislation) return [];
    
    // Combine status from URL params with filters
    const combinedFilters = {
      ...filters,
      status: statusParam !== "all" ? statusParam : filters.status
    };
    
    // First filter by standard filters
    let filtered = filterLegislation(legislation, combinedFilters);
    
    // Then apply tracked terms filter
    if (hasTrackedTermsFilter) {
      filtered = filterLegislationByTrackedTerms(filtered, activeKeywords);
    }
    
    // Then sort
    const sorted = sortLegislation(filtered, filters.sortBy);
    
    return sorted;
  }, [legislation, filters, statusParam, activeKeywords, hasTrackedTermsFilter]);

  const handleStatusChange = (value: string) => {
    if (value === "all") {
      searchParams.delete("status");
    } else {
      searchParams.set("status", value);
    }
    setSearchParams(searchParams);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Browse Legislation</h1>
            </div>
            <StatusFilter 
              value={statusParam}
              onChange={handleStatusChange}
              count={processedLegislation?.length}
            />
          </div>
          
          <form onSubmit={handleSearch} className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search legislation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </form>
        </div>

        {/* Tracked Terms Indicator */}
        {hasTrackedTermsFilter && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
            <Filter className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">
              Filtering by {activeTerms.length} tracked topic{activeTerms.length !== 1 ? 's' : ''}:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {activeTerms.map((term) => (
                <span 
                  key={term.id} 
                  className="px-2 py-0.5 bg-primary/20 text-primary text-xs font-medium rounded-full"
                >
                  {term.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Filters Component */}
        <LegislationFilters
          currentFilters={filters}
          onFilterChange={setFilters}
          availableFilters={availableFilters}
        />

        {/* Results Count */}
        <div className="text-sm text-muted-foreground">
          Showing {processedLegislation.length} of {legislation?.length || 0} items
          {hasTrackedTermsFilter && ' matching your tracked topics'}
        </div>

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
        ) : !legislation || legislation.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No legislation found</p>
          </Card>
        ) : processedLegislation.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">No legislation matches your filters</p>
            <button 
              onClick={() => setFilters({
                sortBy: filters.sortBy,
                author: null,
                district: null,
                city: null,
                status: null
              })}
              className="text-primary hover:underline"
            >
              Clear filters
            </button>
          </Card>
        ) : (
          <div className="space-y-4">
            {processedLegislation.map((item) => (
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
                    {item.author && (
                      <div className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5" />
                        <span>{item.author}</span>
                        {item.district && (
                          <span className="text-primary">({item.district})</span>
                        )}
                      </div>
                    )}
                    {item.city && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{item.city}</span>
                      </div>
                    )}
                    {item.introduced_at && (
                      <div className="flex items-center gap-1">
                        <span>Introduced {format(new Date(item.introduced_at), 'MMM d, yyyy')}</span>
                      </div>
                    )}
                    {item.passed_at && (
                      <div className="flex items-center gap-1">
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
        )}
      </div>
    </Layout>
  );
}
