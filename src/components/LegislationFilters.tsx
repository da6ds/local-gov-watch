import { useState } from 'react';
import { X, Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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
  statuses: string[];
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
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
  const [isStatusExpanded, setIsStatusExpanded] = useState(true);
  const [isAuthorExpanded, setIsAuthorExpanded] = useState(false);
  const [isDistrictExpanded, setIsDistrictExpanded] = useState(false);
  const [isCityExpanded, setIsCityExpanded] = useState(false);
  const [activeDatePreset, setActiveDatePreset] = useState<string | null>(null);

  const activeFilterCount = [
    (currentFilters.statuses && currentFilters.statuses.length > 0) ? 'statuses' : null,
    currentFilters.author,
    currentFilters.district !== null ? currentFilters.district : null,
    currentFilters.city,
    currentFilters.dateRange.start ? 'dateStart' : null,
    currentFilters.dateRange.end ? 'dateEnd' : null,
  ].filter(val => val !== null).length;

  const handleStatusChange = (status: string, checked: boolean) => {
    let newStatuses = [...(currentFilters.statuses || [])];
    if (checked) {
      if (!newStatuses.includes(status)) {
        newStatuses.push(status);
      }
    } else {
      newStatuses = newStatuses.filter(s => s !== status);
    }
    onFilterChange({
      ...currentFilters,
      statuses: newStatuses,
      status: newStatuses.length === 1 ? newStatuses[0] : null
    });
  };

  const handleDateRangeChange = (key: 'start' | 'end', date: Date | undefined) => {
    onFilterChange({
      ...currentFilters,
      dateRange: {
        ...currentFilters.dateRange,
        [key]: date || null
      }
    });
  };

  const setQuickDateRange = (days: number | null, preset: string) => {
    if (days === null) {
      onFilterChange({
        ...currentFilters,
        dateRange: { start: null, end: null }
      });
    } else {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - days);
      onFilterChange({
        ...currentFilters,
        dateRange: { start, end }
      });
    }
    setActiveDatePreset(preset);
  };

  const clearFilters = () => {
    onFilterChange({
      sortBy: currentFilters.sortBy,
      author: null,
      district: null,
      city: null,
      status: null,
      statuses: [],
      dateRange: { start: null, end: null }
    });
    setActiveDatePreset(null);
  };

  const getActiveFilterLabels = () => {
    const labels: string[] = [];
    if (currentFilters.statuses && currentFilters.statuses.length > 0) {
      currentFilters.statuses.forEach(status => labels.push(`Status: ${status}`));
    }
    if (currentFilters.author) labels.push(`Author: ${currentFilters.author}`);
    if (currentFilters.district !== null) labels.push(`District ${currentFilters.district}`);
    if (currentFilters.city) labels.push(currentFilters.city);
    if (activeDatePreset) {
      const presetLabels = {
        'last-30': 'Last 30 Days',
        'last-90': 'Last 90 Days',
        'last-year': 'Last Year',
        'all-time': 'All Time'
      };
      labels.push(`Date: ${presetLabels[activeDatePreset as keyof typeof presetLabels]}`);
    } else if (currentFilters.dateRange.start || currentFilters.dateRange.end) {
      const start = currentFilters.dateRange.start ? format(currentFilters.dateRange.start, 'MMM d') : 'Start';
      const end = currentFilters.dateRange.end ? format(currentFilters.dateRange.end, 'MMM d') : 'End';
      labels.push(`Date: ${start} - ${end}`);
    }
    return labels;
  };

  const activeLabels = getActiveFilterLabels();

  return (
    <div className="space-y-4">
      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/50 p-3">
          <span className="text-sm font-medium">Active:</span>
          {activeLabels.map((label, idx) => (
            <span key={idx} className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium">
              {label}
            </span>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="ml-auto h-7 text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Clear All
          </Button>
        </div>
      )}

      <div className="space-y-4">
        {/* Status Section */}
        <div className="space-y-2">
          <Collapsible open={isStatusExpanded} onOpenChange={setIsStatusExpanded}>
            <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium hover:text-foreground transition-colors w-full">
              <ChevronDown className={`h-4 w-4 transition-transform ${isStatusExpanded ? 'rotate-180' : ''}`} />
              📊 Status
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2 space-y-1">
              {availableFilters.statuses.map(status => (
                <div key={status} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`status-${status}`}
                    checked={currentFilters.statuses?.includes(status) || false}
                    onCheckedChange={(checked) => handleStatusChange(status, checked as boolean)}
                  />
                  <Label htmlFor={`status-${status}`} className="text-sm cursor-pointer flex-1">
                    {status}
                  </Label>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Council Member Section */}
        <div className="space-y-2">
          <Collapsible open={isAuthorExpanded} onOpenChange={setIsAuthorExpanded}>
            <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium hover:text-foreground transition-colors w-full">
              <ChevronDown className={`h-4 w-4 transition-transform ${isAuthorExpanded ? 'rotate-180' : ''}`} />
              👤 Council Member
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2 space-y-1 max-h-60 overflow-y-auto">
              {availableFilters.authors.map(author => (
                <div key={author} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`author-${author}`}
                    checked={currentFilters.author === author}
                    onCheckedChange={(checked) => onFilterChange({
                      ...currentFilters,
                      author: checked ? author : null
                    })}
                  />
                  <Label htmlFor={`author-${author}`} className="text-sm cursor-pointer flex-1">
                    {author}
                  </Label>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* District Section */}
        <div className="space-y-2">
          <Collapsible open={isDistrictExpanded} onOpenChange={setIsDistrictExpanded}>
            <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium hover:text-foreground transition-colors w-full">
              <ChevronDown className={`h-4 w-4 transition-transform ${isDistrictExpanded ? 'rotate-180' : ''}`} />
              🗺️ District
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2 space-y-1">
              {availableFilters.districts.map(district => (
                <div key={district} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`district-${district}`}
                    checked={currentFilters.district === district}
                    onCheckedChange={(checked) => onFilterChange({
                      ...currentFilters,
                      district: checked ? district : null
                    })}
                  />
                  <Label htmlFor={`district-${district}`} className="text-sm cursor-pointer flex-1">
                    District {district}
                  </Label>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* City Section */}
        <div className="space-y-2">
          <Collapsible open={isCityExpanded} onOpenChange={setIsCityExpanded}>
            <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium hover:text-foreground transition-colors w-full">
              <ChevronDown className={`h-4 w-4 transition-transform ${isCityExpanded ? 'rotate-180' : ''}`} />
              🏙️ City
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2 space-y-1">
              {availableFilters.cities.map(city => (
                <div key={city} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`city-${city}`}
                    checked={currentFilters.city === city}
                    onCheckedChange={(checked) => onFilterChange({
                      ...currentFilters,
                      city: checked ? city : null
                    })}
                  />
                  <Label htmlFor={`city-${city}`} className="text-sm cursor-pointer flex-1">
                    {city}
                  </Label>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Date Range Section */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">📅 Date Range</h4>
          
          {/* Date Pickers */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">From</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {currentFilters.dateRange.start ? format(currentFilters.dateRange.start, 'MMM d, yyyy') : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={currentFilters.dateRange.start || undefined}
                    onSelect={(date) => handleDateRangeChange('start', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">To</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {currentFilters.dateRange.end ? format(currentFilters.dateRange.end, 'MMM d, yyyy') : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={currentFilters.dateRange.end || undefined}
                    onSelect={(date) => handleDateRangeChange('end', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-1">
            <Button 
              variant={activeDatePreset === 'last-30' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setQuickDateRange(30, 'last-30')}
            >
              Last 30 Days
            </Button>
            <Button 
              variant={activeDatePreset === 'last-90' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setQuickDateRange(90, 'last-90')}
            >
              Last 90 Days
            </Button>
            <Button 
              variant={activeDatePreset === 'last-year' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setQuickDateRange(365, 'last-year')}
            >
              Last Year
            </Button>
            <Button 
              variant={activeDatePreset === 'all-time' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setQuickDateRange(null, 'all-time')}
            >
              All Time
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
