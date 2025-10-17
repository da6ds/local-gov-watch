import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { X, MapPin, ChevronDown, Navigation, Lock, LockOpen } from "lucide-react";
import { toast } from "sonner";
import { useLocationFilter } from "@/contexts/LocationFilterContext";
import { Badge } from "@/components/ui/badge";

interface LocationSelectorProps {
  value?: string[]; // Array of jurisdiction slugs (optional, uses context if not provided)
  onChange?: (slugs: string[]) => void; // Optional, uses context if not provided
  maxSelections?: number;
  placeholder?: string;
}

export function LocationSelector({ 
  value: externalValue, 
  onChange: externalOnChange, 
  maxSelections,
  placeholder = "Select locations..."
}: LocationSelectorProps) {
  const [open, setOpen] = useState(false);
  const { jurisdictions, selectedLocationSlugs, setSelectedLocations } = useLocationFilter();
  const [lockedGroups, setLockedGroups] = useState<Set<string>>(new Set());
  
  // Use either external control or context
  const value = externalValue ?? selectedLocationSlugs;
  const onChange = externalOnChange ?? setSelectedLocations;

  // Group jurisdictions by type
  const stateJurisdictions = jurisdictions.filter(j => j.type === 'state');
  const countyJurisdictions = jurisdictions.filter(j => j.type === 'county');
  const cityJurisdictions = jurisdictions.filter(j => j.type === 'city');
  const districtJurisdictions = jurisdictions.filter(j => j.type === 'district');

  const selectedJurisdictions = jurisdictions.filter(j => value.includes(j.slug));

  const handleSelect = (slug: string) => {
    if (value.includes(slug)) {
      // Remove selection
      onChange(value.filter(s => s !== slug));
    } else {
      // Add selection (no limit by default)
      if (maxSelections && value.length >= maxSelections) {
        toast.error(`Limit ${maxSelections} locations`, {
          description: "Remove a location to add another."
        });
        return;
      }
      onChange([...value, slug]);
    }
  };

  const handleRemove = (slug: string) => {
    onChange(value.filter(s => s !== slug));
  };

  const handleSelectAllInGroup = (groupJurisdictions: typeof jurisdictions) => {
    const groupSlugs = groupJurisdictions.map(j => j.slug);
    const newSlugs = Array.from(new Set([...value, ...groupSlugs]));
    onChange(newSlugs);
  };

  const handleClearGroup = (groupJurisdictions: typeof jurisdictions) => {
    const groupSlugs = new Set(groupJurisdictions.map(j => j.slug));
    onChange(value.filter(slug => !groupSlugs.has(slug)));
  };

  const handleSelectAll = () => {
    onChange(jurisdictions.map(j => j.slug));
    toast.success("All locations selected");
  };

  const handleClearAll = () => {
    onChange([]);
    toast.info("All locations cleared");
  };

  const toggleLock = (groupType: string) => {
    const newLocked = new Set(lockedGroups);
    if (newLocked.has(groupType)) {
      newLocked.delete(groupType);
    } else {
      newLocked.add(groupType);
    }
    setLockedGroups(newLocked);
  };

  const handleNearMe = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        let nearbyJurisdictionSlugs: string[] = [];
        
        if (latitude >= 37.2 && latitude <= 38.5 && longitude >= -123.5 && longitude <= -121.0) {
          // Bay Area
          nearbyJurisdictionSlugs = [
            'marin-county-ca',
            'sonoma-county-ca',
            'napa-county-ca',
            'california'
          ];
          toast.success("Detected North Bay Area");
        } else if (latitude >= 30.0 && latitude <= 30.5 && longitude >= -98.0 && longitude <= -97.5) {
          // Austin
          nearbyJurisdictionSlugs = [
            'austin-tx',
            'travis-county-tx',
            'texas'
          ];
          toast.success("Detected Austin area");
        } else {
          // Default to Austin for MVP
          nearbyJurisdictionSlugs = ['austin-tx', 'travis-county-tx', 'texas'];
          toast.info("Showing default locations");
        }
        
        const toAdd = nearbyJurisdictionSlugs.filter(slug => 
          !value.includes(slug)
        );
        
        if (toAdd.length > 0) {
          onChange([...value, ...toAdd]);
        } else {
          toast.info("Already showing nearby locations");
        }
        setOpen(false);
      },
      () => {
        toast.error("Location access denied");
      }
    );
  };

  const renderGroup = (
    title: string,
    icon: string,
    groupJurisdictions: typeof jurisdictions,
    groupType: string
  ) => {
    const selectedCount = groupJurisdictions.filter(j => value.includes(j.slug)).length;
    const isLocked = lockedGroups.has(groupType);
    
    return (
      <AccordionItem value={groupType} key={groupType}>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              toggleLock(groupType);
            }}
          >
            {isLocked ? (
              <Lock className="h-4 w-4 text-yellow-500" />
            ) : (
              <LockOpen className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
          <AccordionTrigger className="flex-1 py-3">
            <div className="flex items-center gap-2">
              <span>{icon}</span>
              <span className="font-medium">{title}</span>
              {selectedCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {selectedCount}
                </Badge>
              )}
            </div>
          </AccordionTrigger>
        </div>
        <AccordionContent>
          <div className="space-y-2 pt-2">
            <div className="flex gap-2 pb-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSelectAllInGroup(groupJurisdictions)}
                className="text-xs"
              >
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleClearGroup(groupJurisdictions)}
                className="text-xs"
              >
                Clear All
              </Button>
            </div>
            {groupJurisdictions.map((jurisdiction) => (
              <label
                key={jurisdiction.id}
                className="flex items-center justify-between py-2 px-3 hover:bg-muted rounded cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={value.includes(jurisdiction.slug)}
                    onChange={() => handleSelect(jurisdiction.slug)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">{jurisdiction.name}</span>
                </div>
              </label>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={selectedJurisdictions.length > 0 ? "default" : "outline"}
          size="sm"
          className="h-8 gap-1.5 px-2.5 text-xs md:h-10 md:gap-2 md:px-4 md:text-sm"
        >
          <MapPin className="h-3.5 w-3.5 md:h-4 md:w-4" />
          <span className="hidden sm:inline">
            {selectedJurisdictions.length === 0 
              ? "All Locations" 
              : selectedJurisdictions.length === 1
              ? selectedJurisdictions[0].name
              : `${selectedJurisdictions.length} Locations`
            }
          </span>
          <ChevronDown className="h-3.5 w-3.5 md:h-4 md:w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <div className="space-y-0">
          {/* Header Actions */}
          <div className="p-4 border-b space-y-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleNearMe}
              className="w-full justify-start gap-2"
            >
              <Navigation className="h-4 w-4" />
              Near Me
            </Button>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                className="flex-1 text-xs"
              >
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                className="flex-1 text-xs"
              >
                Clear All
              </Button>
            </div>
          </div>

          {/* Hierarchical Groups */}
          <Accordion type="multiple" className="w-full px-4" defaultValue={["state", "county", "city"]}>
            {stateJurisdictions.length > 0 && renderGroup("State", "🗺️", stateJurisdictions, "state")}
            {countyJurisdictions.length > 0 && renderGroup("County", "🏛️", countyJurisdictions, "county")}
            {cityJurisdictions.length > 0 && renderGroup("City", "🏙️", cityJurisdictions, "city")}
            {districtJurisdictions.length > 0 && renderGroup("District", "🏫", districtJurisdictions, "district")}
          </Accordion>

          {/* Selected Locations */}
          {selectedJurisdictions.length > 0 && (
            <div className="border-t p-4">
              <h4 className="text-sm font-medium mb-3">Selected ({selectedJurisdictions.length})</h4>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {selectedJurisdictions.map((jData) => (
                  <div
                    key={jData.id}
                    className="flex items-center justify-between py-2 px-3 bg-secondary/50 rounded-md"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{jData.name}</span>
                      <span className="text-xs text-muted-foreground capitalize">
                        {jData.type}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => handleRemove(jData.slug)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
