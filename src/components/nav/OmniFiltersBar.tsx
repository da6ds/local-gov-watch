import { useLocation } from "react-router-dom";
import { LocationSelector } from "@/components/LocationSelector";
import { TopicsPopover } from "@/components/TopicsPopover";
import { StatusFilter } from "@/components/filters/StatusFilter";
import { ClearAllButton } from "@/components/filters/ClearAllButton";

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
    <div className="sticky top-14 z-30 w-full border-b bg-muted/30 backdrop-blur supports-[backdrop-filter]:bg-muted/20">
      <div className="container flex h-12 items-center gap-2">
        <LocationSelector 
          value={selectedJurisdictions}
          onChange={onJurisdictionChange}
          maxSelections={3}
        />
        <TopicsPopover />
        {showStatusFilter && statusValue && onStatusChange && (
          <StatusFilter 
            value={statusValue}
            onChange={onStatusChange}
            count={statusCount}
          />
        )}
        <div className="ml-auto">
          <ClearAllButton 
            onClear={onClearAll || (() => {})}
            show={showClearAll}
          />
        </div>
      </div>
    </div>
  );
}
