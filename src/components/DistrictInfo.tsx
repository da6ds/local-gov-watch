import { MapPin, Building2, Flag } from 'lucide-react';

interface DistrictInfoProps {
  cityDistrict?: number | null;
  countyDistrict?: number | null;
  stateSenateDistrict?: number | null;
  stateAssemblyDistrict?: number | null;
  congressionalDistrict?: number | null;
  stateSenator?: string | null;
  assemblyMember?: string | null;
  congressionalRep?: string | null;
  state?: 'CA' | 'TX';
  compact?: boolean;
}

export const DistrictInfo = ({
  cityDistrict,
  countyDistrict,
  stateSenateDistrict,
  stateAssemblyDistrict,
  congressionalDistrict,
  stateSenator,
  assemblyMember,
  congressionalRep,
  state = 'TX',
  compact = false
}: DistrictInfoProps) => {
  const hasAnyDistrict = cityDistrict || countyDistrict || stateSenateDistrict || 
                         stateAssemblyDistrict || congressionalDistrict;
  
  if (!hasAnyDistrict) return null;
  
  const stateLabel = state === 'CA' ? 'California' : 'Texas';
  const assemblyLabel = state === 'CA' ? 'Assembly' : 'House';
  
  if (compact) {
    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {cityDistrict && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
            City D{cityDistrict}
          </span>
        )}
        {stateSenateDistrict && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
            State SD-{stateSenateDistrict}
          </span>
        )}
        {congressionalDistrict && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            {state}-{congressionalDistrict}
          </span>
        )}
      </div>
    );
  }
  
  return (
    <div className="bg-card border rounded-lg p-6 mt-6">
      <h3 className="flex items-center gap-2 text-lg font-semibold mb-4">
        <MapPin className="h-5 w-5" />
        Representative Districts
      </h3>
      
      <div className="space-y-6">
        {/* Local Districts */}
        {(cityDistrict || countyDistrict) && (
          <div className="border-l-2 border-border pl-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              <Building2 className="h-4 w-4" />
              <span>Local</span>
            </div>
            <div className="space-y-3">
              {cityDistrict && (
                <div className="flex justify-between items-start py-2 border-b last:border-b-0">
                  <span className="text-sm text-muted-foreground">City Council District</span>
                  <span className="font-medium">District {cityDistrict}</span>
                </div>
              )}
              {countyDistrict && (
                <div className="flex justify-between items-start py-2 border-b last:border-b-0">
                  <span className="text-sm text-muted-foreground">County Supervisor District</span>
                  <span className="font-medium">District {countyDistrict}</span>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* State Districts */}
        {(stateSenateDistrict || stateAssemblyDistrict) && (
          <div className="border-l-2 border-border pl-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              <Flag className="h-4 w-4" />
              <span>{stateLabel} State</span>
            </div>
            <div className="space-y-3">
              {stateSenateDistrict && (
                <div className="flex justify-between items-start py-2 border-b last:border-b-0">
                  <span className="text-sm text-muted-foreground">State Senate</span>
                  <div className="flex flex-col items-end">
                    <span className="font-medium">District {stateSenateDistrict}</span>
                    {stateSenator && (
                      <span className="text-sm text-muted-foreground mt-1">{stateSenator}</span>
                    )}
                  </div>
                </div>
              )}
              {stateAssemblyDistrict && (
                <div className="flex justify-between items-start py-2 border-b last:border-b-0">
                  <span className="text-sm text-muted-foreground">State {assemblyLabel}</span>
                  <div className="flex flex-col items-end">
                    <span className="font-medium">District {stateAssemblyDistrict}</span>
                    {assemblyMember && (
                      <span className="text-sm text-muted-foreground mt-1">{assemblyMember}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Federal District */}
        {congressionalDistrict && (
          <div className="border-l-2 border-border pl-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              <Flag className="h-4 w-4" />
              <span>US Congress</span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-start py-2">
                <span className="text-sm text-muted-foreground">Congressional District</span>
                <div className="flex flex-col items-end">
                  <span className="font-medium">{state}-{congressionalDistrict}</span>
                  {congressionalRep && (
                    <span className="text-sm text-muted-foreground mt-1">{congressionalRep}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
