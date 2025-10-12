import { useState } from 'react';
import { ChevronDown, X, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

export type SortOption = 
  | 'introduced_desc'
  | 'introduced_asc'
  | 'updated_desc'
  | 'title_asc'
  | 'title_desc';

export interface FilterOptions {
  sortBy: SortOption;
  author: string | null;
  district: number | null;
  city: string | null;
  status: string | null;
}

interface LegislationFiltersProps {
  currentFilters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  availableFilters: {
    authors: string[];
    districts: number[];
    cities: string[];
    statuses: string[];
  };
}

export const LegislationFilters = ({
  currentFilters,
  onFilterChange,
  availableFilters
}: LegislationFiltersProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const activeFilterCount = [
    currentFilters.author,
    currentFilters.district !== null ? currentFilters.district : null,
    currentFilters.city,
    currentFilters.status
  ].filter(val => val !== null).length;

  const handleSortChange = (value: SortOption) => {
    onFilterChange({ ...currentFilters, sortBy: value });
  };

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    onFilterChange({ ...currentFilters, [key]: value });
  };

  const clearFilters = () => {
    onFilterChange({
      sortBy: currentFilters.sortBy,
      author: null,
      district: null,
      city: null,
      status: null
    });
  };

  const getSortLabel = (option: SortOption): string => {
    const labels: Record<SortOption, string> = {
      introduced_desc: 'Most Recently Introduced',
      introduced_asc: 'Oldest First',
      updated_desc: 'Last Updated',
      title_asc: 'Title (A-Z)',
      title_desc: 'Title (Z-A)'
    };
    return labels[option];
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-card rounded-lg border mb-6">
      {/* Sort Control and Filter Toggle */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">
            Sort by:
          </label>
          <Select value={currentFilters.sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="flex-1">
              <SelectValue />
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

        <Button
          variant="outline"
          onClick={() => setIsExpanded(!isExpanded)}
          className="gap-2"
        >
          <Filter size={16} />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded-full text-xs font-semibold">
              {activeFilterCount}
            </span>
          )}
          <ChevronDown 
            size={16} 
            className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          />
        </Button>
      </div>

      {/* Expanded Filter Panel */}
      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
          {/* Author Filter */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-muted-foreground">
              Council Member
            </label>
            <Select 
              value={currentFilters.author || 'all'} 
              onValueChange={(val) => handleFilterChange('author', val === 'all' ? null : val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Authors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Authors</SelectItem>
                {availableFilters.authors.map(author => (
                  <SelectItem key={author} value={author}>
                    {author}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* District Filter */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-muted-foreground">
              District
            </label>
            <Select 
              value={currentFilters.district?.toString() || 'all'} 
              onValueChange={(val) => handleFilterChange('district', val === 'all' ? null : Number(val))}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Districts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Districts</SelectItem>
                {availableFilters.districts.map(district => (
                  <SelectItem key={district} value={district.toString()}>
                    District {district}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* City Filter */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-muted-foreground">
              City
            </label>
            <Select 
              value={currentFilters.city || 'all'} 
              onValueChange={(val) => handleFilterChange('city', val === 'all' ? null : val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Cities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {availableFilters.cities.map(city => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-muted-foreground">
              Status
            </label>
            <Select 
              value={currentFilters.status || 'all'} 
              onValueChange={(val) => handleFilterChange('status', val === 'all' ? null : val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {availableFilters.statuses.map(status => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Clear Filters Button */}
          {activeFilterCount > 0 && (
            <div className="col-span-full">
              <Button 
                variant="outline"
                onClick={clearFilters}
                className="gap-2"
              >
                <X size={16} />
                Clear all filters
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Active Filter Pills */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {currentFilters.author && (
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium">
              Author: {currentFilters.author}
              <button 
                onClick={() => handleFilterChange('author', null)}
                className="hover:opacity-70 transition-opacity"
              >
                <X size={14} />
              </button>
            </span>
          )}
          {currentFilters.district !== null && (
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium">
              District {currentFilters.district}
              <button 
                onClick={() => handleFilterChange('district', null)}
                className="hover:opacity-70 transition-opacity"
              >
                <X size={14} />
              </button>
            </span>
          )}
          {currentFilters.city && (
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium">
              {currentFilters.city}
              <button 
                onClick={() => handleFilterChange('city', null)}
                className="hover:opacity-70 transition-opacity"
              >
                <X size={14} />
              </button>
            </span>
          )}
          {currentFilters.status && (
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium">
              Status: {currentFilters.status}
              <button 
                onClick={() => handleFilterChange('status', null)}
                className="hover:opacity-70 transition-opacity"
              >
                <X size={14} />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};
