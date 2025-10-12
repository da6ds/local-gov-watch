import { Filter, Check, ChevronDown } from 'lucide-react';
import { useTrackedTermsFilter } from '@/hooks/useTrackedTermsFilter';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export const TrackedTermsFilter = () => {
  const {
    allTerms,
    activeFilterIds,
    toggleFilter,
    clearFilters,
    hasActiveFilters
  } = useTrackedTermsFilter();

  if (allTerms.length === 0) {
    return null; // Don't show the filter if no terms exist
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="gap-1.5 relative"
        >
          <Filter className="h-4 w-4" />
          <span className="hidden sm:inline">My Topics</span>
          {hasActiveFilters && (
            <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-primary text-primary-foreground rounded-full text-xs font-semibold">
              {activeFilterIds.length}
            </span>
          )}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b">
            <h3 className="font-semibold text-sm">Filter by Tracked Topics</h3>
            {hasActiveFilters && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={clearFilters}
                className="h-auto py-1 px-2 text-xs"
              >
                Clear all
              </Button>
            )}
          </div>

          {/* Terms List */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {allTerms.map(term => {
              const isActive = activeFilterIds.includes(term.id);
              return (
                <button
                  key={term.id}
                  onClick={() => toggleFilter(term.id)}
                  className={`
                    w-full flex items-center gap-3 p-2.5 rounded-md border transition-all text-left
                    ${isActive 
                      ? 'bg-primary/10 border-primary' 
                      : 'bg-background border-border hover:bg-accent'
                    }
                  `}
                >
                  <div className={`
                    flex items-center justify-center w-4 h-4 rounded border-2 flex-shrink-0 transition-colors
                    ${isActive 
                      ? 'bg-primary border-primary' 
                      : 'border-muted-foreground'
                    }
                  `}>
                    {isActive && <Check className="h-3 w-3 text-primary-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{term.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {term.keywords.join(', ')}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="pt-3 border-t space-y-2">
            <p className="text-xs text-muted-foreground text-center">
              Select topics to filter legislation and meetings
            </p>
            <Link to="/tracked-terms">
              <Button variant="outline" size="sm" className="w-full">
                Manage Tracked Terms
              </Button>
            </Link>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
