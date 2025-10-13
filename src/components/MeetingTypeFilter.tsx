import { useState } from 'react';
import { ChevronDown, Gavel, Clipboard, CheckSquare, Square } from 'lucide-react';
import { MeetingType } from './MeetingFilters';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface MeetingTypeFilterProps {
  selectedTypes: MeetingType[];
  onTypesChange: (types: MeetingType[]) => void;
  typeCounts: Record<MeetingType, number>;
}

const LEGISLATIVE_TYPES: MeetingType[] = ['city_council', 'board_of_supervisors'];
const ADVISORY_TYPES: MeetingType[] = ['committee', 'commission', 'authority'];

const TYPE_LABELS: Record<MeetingType, string> = {
  city_council: 'City Councils',
  board_of_supervisors: 'Board of Supervisors',
  committee: 'Committees',
  commission: 'Commissions',
  authority: 'Authorities'
};

export function MeetingTypeFilter({ 
  selectedTypes, 
  onTypesChange,
  typeCounts 
}: MeetingTypeFilterProps) {
  const [advisoryExpanded, setAdvisoryExpanded] = useState(false);

  const toggleType = (type: MeetingType) => {
    if (selectedTypes.includes(type)) {
      onTypesChange(selectedTypes.filter(t => t !== type));
    } else {
      onTypesChange([...selectedTypes, type]);
    }
  };

  const toggleLegislative = () => {
    const allLegislativeSelected = LEGISLATIVE_TYPES.every(t => selectedTypes.includes(t));
    if (allLegislativeSelected) {
      onTypesChange(selectedTypes.filter(t => !LEGISLATIVE_TYPES.includes(t)));
    } else {
      const newTypes = [...selectedTypes];
      LEGISLATIVE_TYPES.forEach(t => {
        if (!newTypes.includes(t)) newTypes.push(t);
      });
      onTypesChange(newTypes);
    }
  };

  const allLegislativeSelected = LEGISLATIVE_TYPES.every(t => selectedTypes.includes(t));
  const someLegislativeSelected = LEGISLATIVE_TYPES.some(t => selectedTypes.includes(t));

  return (
    <div className="flex flex-col gap-3 p-4 bg-card rounded-lg border">
      <div className="flex items-center gap-2 mb-2">
        <Gavel className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Meeting Type</h3>
      </div>

      {/* Legislative Bodies - Always Visible */}
      <div className="space-y-2">
        <button
          onClick={toggleLegislative}
          className="flex items-center gap-2 w-full text-left group hover:bg-muted/50 p-2 rounded transition-colors"
        >
          <div className="flex items-center justify-center w-5 h-5">
            {allLegislativeSelected ? (
              <CheckSquare className="h-5 w-5 text-primary" />
            ) : someLegislativeSelected ? (
              <div className="w-4 h-4 border-2 border-primary bg-primary/20 rounded" />
            ) : (
              <Square className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <span className="font-semibold text-sm">Legislative Bodies</span>
          <span className="text-xs text-muted-foreground ml-auto">(Where Laws Are Passed)</span>
        </button>

        <div className="ml-7 space-y-1.5">
          {LEGISLATIVE_TYPES.map(type => (
            <button
              key={type}
              onClick={() => toggleType(type)}
              className="flex items-center gap-2 w-full text-left group hover:bg-muted/50 p-1.5 rounded transition-colors"
            >
              <div className="flex items-center justify-center w-4 h-4">
                {selectedTypes.includes(type) ? (
                  <CheckSquare className="h-4 w-4 text-primary" />
                ) : (
                  <Square className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <span className="text-sm">{TYPE_LABELS[type]}</span>
              <span className="ml-auto text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {typeCounts[type] || 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Advisory Bodies - Collapsible */}
      <Collapsible open={advisoryExpanded} onOpenChange={setAdvisoryExpanded}>
        <CollapsibleTrigger asChild>
          <button className="flex items-center gap-2 w-full text-left group hover:bg-muted/50 p-2 rounded transition-colors">
            <ChevronDown 
              className={`h-4 w-4 text-muted-foreground transition-transform ${advisoryExpanded ? 'rotate-180' : ''}`} 
            />
            <Clipboard className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">All Other Meeting Types</span>
            <span className="text-xs text-muted-foreground ml-auto">(Advisory Bodies)</span>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-2">
          <div className="ml-7 space-y-1.5">
            {ADVISORY_TYPES.map(type => (
              <button
                key={type}
                onClick={() => toggleType(type)}
                className="flex items-center gap-2 w-full text-left group hover:bg-muted/50 p-1.5 rounded transition-colors"
              >
                <div className="flex items-center justify-center w-4 h-4">
                  {selectedTypes.includes(type) ? (
                    <CheckSquare className="h-4 w-4 text-primary" />
                  ) : (
                    <Square className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <span className="text-sm text-muted-foreground">{TYPE_LABELS[type]}</span>
                <span className="ml-auto text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {typeCounts[type] || 0}
                </span>
              </button>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
