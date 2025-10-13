import { useState } from 'react';
import { ChevronDown, X, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { MeetingTypeFilter } from './MeetingTypeFilter';

export type MeetingSortOption = 
  | 'date_desc'
  | 'date_asc'
  | 'title_asc'
  | 'title_desc';

export type MeetingType = 
  | 'city_council'
  | 'board_of_supervisors'
  | 'committee'
  | 'commission'
  | 'authority';

export interface MeetingFilterOptions {
  sortBy: MeetingSortOption;
  status: string | null;
  city: string | null;
  bodyName: string | null;
  meetingTypes: MeetingType[];
  legislativeOnly: boolean;
}

interface MeetingFiltersProps {
  currentFilters: MeetingFilterOptions;
  onFilterChange: (filters: MeetingFilterOptions) => void;
  availableFilters: {
    cities: string[];
    bodyNames: string[];
    typeCounts: Record<MeetingType, number>;
  };
}

export const MeetingFilters = ({
  currentFilters,
  onFilterChange,
  availableFilters
}: MeetingFiltersProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const activeFilterCount = [
    currentFilters.status,
    currentFilters.city,
    currentFilters.bodyName,
    currentFilters.meetingTypes.length > 0 ? 'types' : null,
    currentFilters.legislativeOnly ? 'legislative' : null
  ].filter(val => val !== null).length;

  const handleSortChange = (value: MeetingSortOption) => {
    onFilterChange({ ...currentFilters, sortBy: value });
  };

  const handleFilterChange = (key: keyof MeetingFilterOptions, value: any) => {
    onFilterChange({ ...currentFilters, [key]: value });
  };

  const clearFilters = () => {
    onFilterChange({
      sortBy: currentFilters.sortBy,
      status: null,
      city: null,
      bodyName: null,
      meetingTypes: [],
      legislativeOnly: false
    });
  };

  return (
    <div className="space-y-4 mb-6">
      {/* Meeting Type Filter - Always Visible */}
      <MeetingTypeFilter
        selectedTypes={currentFilters.meetingTypes}
        onTypesChange={(types) => handleFilterChange('meetingTypes', types)}
        typeCounts={availableFilters.typeCounts}
      />

      {/* Other Filters */}
      <div className="flex flex-col gap-4 p-4 bg-card rounded-lg border">
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
              <SelectItem value="date_desc">Soonest First</SelectItem>
              <SelectItem value="date_asc">Latest First</SelectItem>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t">
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
                <SelectValue placeholder="All Meetings" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Meetings</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="past">Past</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="this-week">This Week</SelectItem>
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

          {/* Body Name Filter */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-muted-foreground">
              Meeting Type
            </label>
            <Select 
              value={currentFilters.bodyName || 'all'} 
              onValueChange={(val) => handleFilterChange('bodyName', val === 'all' ? null : val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {availableFilters.bodyNames.map(name => (
                  <SelectItem key={name} value={name}>
                    {name}
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
          {currentFilters.bodyName && (
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium">
              {currentFilters.bodyName}
              <button 
                onClick={() => handleFilterChange('bodyName', null)}
                className="hover:opacity-70 transition-opacity"
              >
                <X size={14} />
              </button>
            </span>
          )}
        </div>
      )}
      </div>
    </div>
  );
};
