import { useState } from 'react';
import { ChevronDown, X, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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
  documentStatus: {
    agendaAvailable: boolean;
    minutesAvailable: boolean;
    liveNow: boolean;
  };
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
}

interface MeetingFiltersProps {
  currentFilters: MeetingFilterOptions;
  onFilterChange: (filters: MeetingFilterOptions) => void;
  availableFilters: {
    cities: string[];
    bodyNames: string[];
    typeCounts: Record<MeetingType, number>;
    agendaCount: number;
    minutesCount: number;
    liveCount: number;
  };
}

export const MeetingFilters = ({
  currentFilters,
  onFilterChange,
  availableFilters
}: MeetingFiltersProps) => {
  const [isAdvisoryExpanded, setIsAdvisoryExpanded] = useState(false);
  const [activeDatePreset, setActiveDatePreset] = useState<string | null>(null);

  // Calculate active filter count
  const activeFilterCount = [
    currentFilters.meetingTypes.length > 0 ? 'types' : null,
    currentFilters.legislativeOnly ? 'legislative' : null,
    currentFilters.documentStatus.agendaAvailable ? 'agenda' : null,
    currentFilters.documentStatus.minutesAvailable ? 'minutes' : null,
    currentFilters.documentStatus.liveNow ? 'live' : null,
    currentFilters.dateRange.start ? 'dateStart' : null,
    currentFilters.dateRange.end ? 'dateEnd' : null,
  ].filter(val => val !== null).length;

  const handleLegislativeToggle = (checked: boolean) => {
    if (checked) {
      onFilterChange({
        ...currentFilters,
        legislativeOnly: true,
        meetingTypes: ['city_council', 'board_of_supervisors']
      });
    } else {
      onFilterChange({
        ...currentFilters,
        legislativeOnly: false
      });
    }
  };

  const handleMeetingTypeChange = (type: MeetingType, checked: boolean) => {
    let newTypes = [...currentFilters.meetingTypes];
    
    if (checked) {
      if (!newTypes.includes(type)) {
        newTypes.push(type);
      }
    } else {
      newTypes = newTypes.filter(t => t !== type);
    }

    const hasCouncil = newTypes.includes('city_council');
    const hasSupervisors = newTypes.includes('board_of_supervisors');
    const hasAdvisory = newTypes.some(t => ['committee', 'commission', 'authority'].includes(t));
    const shouldEnableLegislative = hasCouncil && hasSupervisors && !hasAdvisory;

    onFilterChange({
      ...currentFilters,
      meetingTypes: newTypes,
      legislativeOnly: shouldEnableLegislative
    });
  };

  const handleDocumentStatusChange = (key: keyof MeetingFilterOptions['documentStatus'], checked: boolean) => {
    onFilterChange({
      ...currentFilters,
      documentStatus: {
        ...currentFilters.documentStatus,
        [key]: checked
      }
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
      end.setDate(end.getDate() + 90);
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
      status: null,
      city: null,
      bodyName: null,
      meetingTypes: [],
      legislativeOnly: false,
      documentStatus: {
        agendaAvailable: false,
        minutesAvailable: false,
        liveNow: false
      },
      dateRange: {
        start: null,
        end: null
      }
    });
    setIsAdvisoryExpanded(false);
    setActiveDatePreset(null);
  };

  const getActiveFilterLabels = () => {
    const labels: string[] = [];
    
    if (currentFilters.legislativeOnly) {
      labels.push('Legislative Bodies Only');
    }
    if (currentFilters.meetingTypes.length > 0) {
      const typeNames = {
        city_council: 'City Councils',
        board_of_supervisors: 'Board of Supervisors',
        committee: 'Committees',
        commission: 'Commissions',
        authority: 'Authorities'
      };
      currentFilters.meetingTypes.forEach(type => {
        labels.push(typeNames[type]);
      });
    }
    if (currentFilters.documentStatus.agendaAvailable) {
      labels.push('Agenda Available');
    }
    if (currentFilters.documentStatus.minutesAvailable) {
      labels.push('Minutes Available');
    }
    if (currentFilters.documentStatus.liveNow) {
      labels.push('Live Now');
    }
    if (activeDatePreset) {
      const presetLabels = {
        'last-7': 'Last 7 Days',
        'last-30': 'Last 30 Days',
        'last-90': 'Last 90 Days',
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

      {/* Meeting Types Section */}
      <div className="space-y-2">
        <h4 className="font-medium text-sm">Meeting Type</h4>
        
        {/* Legislative Bodies Toggle */}
        <div className="flex items-center space-x-2 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
          <Checkbox 
            id="legislative-toggle"
            checked={currentFilters.legislativeOnly}
            onCheckedChange={handleLegislativeToggle}
          />
          <Label htmlFor="legislative-toggle" className="text-sm font-medium cursor-pointer flex-1">
            ⚖️ Legislative Bodies (Where Laws Are Passed)
          </Label>
        </div>

        {/* Legislative Body Types */}
        <div className="pl-4 space-y-1">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="city-council"
              checked={currentFilters.meetingTypes.includes('city_council')}
              onCheckedChange={(checked) => handleMeetingTypeChange('city_council', checked as boolean)}
            />
            <Label htmlFor="city-council" className="text-sm cursor-pointer flex-1">
              City Councils ({availableFilters.typeCounts.city_council || 0})
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="board-supervisors"
              checked={currentFilters.meetingTypes.includes('board_of_supervisors')}
              onCheckedChange={(checked) => handleMeetingTypeChange('board_of_supervisors', checked as boolean)}
            />
            <Label htmlFor="board-supervisors" className="text-sm cursor-pointer flex-1">
              Board of Supervisors ({availableFilters.typeCounts.board_of_supervisors || 0})
            </Label>
          </div>
        </div>

        {/* Advisory Bodies - Collapsible */}
        <Collapsible open={isAdvisoryExpanded} onOpenChange={setIsAdvisoryExpanded}>
          <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium hover:text-foreground transition-colors w-full">
            <ChevronDown className={`h-4 w-4 transition-transform ${isAdvisoryExpanded ? 'rotate-180' : ''}`} />
            All Other Meeting Types (Advisory Bodies)
          </CollapsibleTrigger>
          <CollapsibleContent className="pl-4 pt-2 space-y-1">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="committees"
                checked={currentFilters.meetingTypes.includes('committee')}
                onCheckedChange={(checked) => handleMeetingTypeChange('committee', checked as boolean)}
              />
              <Label htmlFor="committees" className="text-sm cursor-pointer flex-1">
                Committees ({availableFilters.typeCounts.committee || 0})
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="commissions"
                checked={currentFilters.meetingTypes.includes('commission')}
                onCheckedChange={(checked) => handleMeetingTypeChange('commission', checked as boolean)}
              />
              <Label htmlFor="commissions" className="text-sm cursor-pointer flex-1">
                Commissions ({availableFilters.typeCounts.commission || 0})
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="authorities"
                checked={currentFilters.meetingTypes.includes('authority')}
                onCheckedChange={(checked) => handleMeetingTypeChange('authority', checked as boolean)}
              />
              <Label htmlFor="authorities" className="text-sm cursor-pointer flex-1">
                Authorities ({availableFilters.typeCounts.authority || 0})
              </Label>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Document Status Section */}
      <div className="space-y-2">
        <h4 className="font-medium text-sm">Document Status</h4>
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="agenda-available"
              checked={currentFilters.documentStatus.agendaAvailable}
              onCheckedChange={(checked) => handleDocumentStatusChange('agendaAvailable', checked as boolean)}
            />
            <Label htmlFor="agenda-available" className="text-sm cursor-pointer flex-1">
              📄 Agenda Available ({availableFilters.agendaCount})
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="minutes-available"
              checked={currentFilters.documentStatus.minutesAvailable}
              onCheckedChange={(checked) => handleDocumentStatusChange('minutesAvailable', checked as boolean)}
            />
            <Label htmlFor="minutes-available" className="text-sm cursor-pointer flex-1">
              📝 Minutes Available ({availableFilters.minutesCount})
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="live-now"
              checked={currentFilters.documentStatus.liveNow}
              onCheckedChange={(checked) => handleDocumentStatusChange('liveNow', checked as boolean)}
            />
            <Label htmlFor="live-now" className="text-sm cursor-pointer flex-1">
              🔴 Live Now ({availableFilters.liveCount})
            </Label>
          </div>
        </div>
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
            variant={activeDatePreset === 'last-7' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setQuickDateRange(7, 'last-7')}
          >
            Last 7 Days
          </Button>
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
            variant={activeDatePreset === 'all-time' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setQuickDateRange(null, 'all-time')}
          >
            All Time
          </Button>
        </div>
      </div>

      {/* Clear Filters Button */}
      {activeFilterCount > 0 && (
        <Button 
          variant="outline"
          onClick={clearFilters}
          className="w-full gap-2"
        >
          <X size={16} />
          Clear All Filters
        </Button>
      )}
    </div>
  );
};
