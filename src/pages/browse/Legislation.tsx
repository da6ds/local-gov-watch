import { Layout } from "@/components/Layout";
import { useMemo, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, User, MapPin, Filter } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/StatusBadge";
import { TagChips } from "@/components/TagChips";
import { format } from "date-fns";
import { LegislationFilters } from "@/components/LegislationFilters";
import { useLegislationFilters } from "@/hooks/useLegislationFilters";
import { sortLegislation } from "@/lib/legislationSorting";
import { filterLegislation, getAvailableFilters } from "@/lib/legislationFiltering";
import { useTrackedTermsFilter } from "@/hooks/useTrackedTermsFilter";
import { filterLegislationByTrackedTerms } from "@/lib/trackedTermsFiltering";
import { DistrictInfo } from "@/components/DistrictInfo";
import { useFilteredLegislation } from "@/hooks/useFilteredQueries";
import { useLocationFilter } from "@/contexts/LocationFilterContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CollapsibleSection } from "@/components/CollapsibleSection";

export default function BrowseLegislation() {
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const { selectedLocationSlugs } = useLocationFilter();
  const { filters, setFilters } = useLegislationFilters();
  const { activeKeywords, hasActiveFilters: hasTrackedTermsFilter, activeTerms } = useTrackedTermsFilter();

  // Debounced search
  const debouncedSearch = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (value: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          setSearchTerm(value);
        }, 300);
      };
    })(),
    []
  );

  // Fetch legislation using filtered query
  const { data: legislation, isLoading } = useFilteredLegislation({
    limit: 100,
    orderBy: 'introduced_at',
    ascending: false
  });

  // Apply search term filter client-side
  const searchFilteredLegislation = useMemo(() => {
    if (!legislation) return [];
    if (!searchTerm) return legislation;
    
    const term = searchTerm.toLowerCase();
    return legislation.filter(item => 
      item.title?.toLowerCase().includes(term) ||
      item.summary?.toLowerCase().includes(term)
    );
  }, [legislation, searchTerm]);

  // Calculate available filter options from fetched data
  const availableFilters = useMemo(() => {
    if (!searchFilteredLegislation) return { authors: [], districts: [], cities: [], statuses: [] };
    return getAvailableFilters(searchFilteredLegislation);
  }, [searchFilteredLegislation]);

  // Apply filters and sorting client-side
  const processedLegislation = useMemo(() => {
    if (!searchFilteredLegislation) return [];
    
    // First filter by standard filters
    let filtered = filterLegislation(searchFilteredLegislation, filters);
    
    // Then apply tracked terms filter
    if (hasTrackedTermsFilter) {
      filtered = filterLegislationByTrackedTerms(filtered, activeKeywords);
    }
    
    // Then sort
    const sorted = sortLegislation(filtered, filters.sortBy);
    
    return sorted;
  }, [searchFilteredLegislation, filters, activeKeywords, hasTrackedTermsFilter]);

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Browse Legislation</h1>

        {/* Search and Sort */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search legislation..."
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                debouncedSearch(e.target.value);
              }}
              className="pl-10"
            />
          </div>
          <Select value={filters.sortBy} onValueChange={(value) => setFilters({ ...filters, sortBy: value as any })}>
            <SelectTrigger className="w-full sm:w-[240px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="introduced_desc">Most Recently Introduced</SelectItem>
              <SelectItem value="introduced_asc">Oldest First</SelectItem>
              <SelectItem value="updated_desc">Last Updated</SelectItem>
              <SelectItem value="title_asc">Title (A-Z)</SelectItem>
              <SelectItem value="title_desc">Title (Z-A)</SelectItem>
            </SelectContent>
          </Select>
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

        {/* Filters Section */}
        <CollapsibleSection 
          storageKey="legislation-filters" 
          title="Filters"
          defaultExpanded={true}
        >
          <LegislationFilters
            currentFilters={filters}
            onFilterChange={setFilters}
            availableFilters={availableFilters}
          />
        </CollapsibleSection>

        {/* Results Count */}
        <div className="text-sm text-muted-foreground">
          Showing {processedLegislation.length} of {searchFilteredLegislation?.length || 0} items
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
                status: null,
                statuses: [],
                dateRange: { start: null, end: null }
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

                  {/* District Badges */}
                  <DistrictInfo
                    cityDistrict={item.city_district || item.district_number}
                    stateSenateDistrict={item.state_senate_district}
                    congressionalDistrict={item.congressional_district}
                    state="TX"
                    compact={true}
                  />

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
