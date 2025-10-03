import { useLocation } from "react-router-dom";
import { LocationSelector } from "@/components/LocationSelector";
import { CategoriesPopover } from "@/components/CategoriesPopover";
import { StatusFilter } from "@/components/filters/StatusFilter";

interface OmniFiltersBarProps {
  selectedJurisdictions: string[];
  onJurisdictionChange: (slugs: string[]) => void;
  statusValue?: string;
  onStatusChange?: (value: string) => void;
  statusCount?: number;
  onClearAll?: () => void;
  showClearAll?: boolean;
}

export function OmniFiltersBar({
  selectedJurisdictions,
  onJurisdictionChange,
  statusValue,
  onStatusChange,
  statusCount,
  onClearAll,
  showClearAll = false,
}: OmniFiltersBarProps) {
  const location = useLocation();
  
  // Show status filter only on legislation and meetings pages
  const showStatusFilter = 
    location.pathname === "/browse/legislation" || 
    location.pathname === "/browse/meetings";

  return (
    <div className="sticky top-12 md:top-14 z-30 w-full border-b bg-muted/30 backdrop-blur supports-[backdrop-filter]:bg-muted/20">
      <div className="container flex h-10 md:h-12 items-center gap-1.5 md:gap-2 overflow-x-auto scrollbar-hide">
        <div className="grid grid-cols-2 md:flex items-center gap-1.5 md:gap-2 w-full md:w-auto">
          <LocationSelector 
            value={selectedJurisdictions}
            onChange={onJurisdictionChange}
            maxSelections={3}
          />
          <CategoriesPopover />
          {showStatusFilter && statusValue && onStatusChange && (
            <StatusFilter 
              value={statusValue}
              onChange={onStatusChange}
              count={statusCount}
            />
          )}
        </div>
      </div>
    </div>
  );
}
