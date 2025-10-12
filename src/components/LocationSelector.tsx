import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { X, MapPin, ChevronDown, Navigation } from "lucide-react";
import { toast } from "sonner";

interface LocationSelectorProps {
  value: string[]; // Array of jurisdiction slugs
  onChange: (slugs: string[]) => void;
  maxSelections?: number;
  placeholder?: string;
}

export function LocationSelector({ 
  value, 
  onChange, 
  maxSelections = 3,
  placeholder = "Select locations..."
}: LocationSelectorProps) {
  const [open, setOpen] = useState(false);
  
  // Fetch all jurisdictions
  const { data: jurisdictions = [] } = useQuery({
    queryKey: ['jurisdictions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jurisdiction')
        .select('id, slug, name, type')
        .order('name');
      
      if (error) throw error;
      return data || [];
    }
  });

  const selectedJurisdictions = jurisdictions.filter(j => value.includes(j.slug));

  const handleSelect = (slug: string) => {
    if (value.includes(slug)) {
      // Remove selection
      onChange(value.filter(s => s !== slug));
    } else {
      // Add selection if under limit
      if (value.length >= maxSelections) {
        toast.error(`Limit ${maxSelections} in demo`, {
          description: "Future paid plans will allow more locations."
        });
        return;
      }
      onChange([...value, slug]);
    }
  };

  const handleRemove = (slug: string) => {
    onChange(value.filter(s => s !== slug));
  };

  const handleNearMe = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Simple region detection based on coordinates
        // Bay Area: roughly 37.2-38.5 N, -123.5 to -121.0 W
        // Austin: roughly 30.0-30.5 N, -98.0 to -97.5 W
        
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
        ).slice(0, maxSelections - value.length);
        
        if (toAdd.length > 0) {
          onChange([...value, ...toAdd].slice(0, maxSelections));
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
              ? "Location" 
              : selectedJurisdictions.length === 1
              ? selectedJurisdictions[0].name
              : `${selectedJurisdictions.length} Locations`
            }
          </span>
          <ChevronDown className="h-3.5 w-3.5 md:h-4 md:w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[360px] p-4" align="start">
        <div className="space-y-4">
          {/* Near Me Button */}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleNearMe}
            className="w-full justify-start gap-2"
          >
            <Navigation className="h-4 w-4" />
            Near Me
          </Button>

          {/* Search Bar */}
          <div className="border-t pt-4">
            <Command>
              <CommandInput placeholder="Search city, county, state..." className="h-9" />
              <CommandList className="max-h-[240px]">
                <CommandEmpty>No locations found.</CommandEmpty>
                <CommandGroup>
                  {jurisdictions.filter(j => !value.includes(j.slug)).map((jurisdiction) => (
                    <CommandItem
                      key={jurisdiction.id}
                      value={jurisdiction.slug}
                      onSelect={() => {
                        handleSelect(jurisdiction.slug);
                        if (value.length + 1 >= maxSelections) setOpen(false);
                      }}
                      className="text-sm"
                    >
                      <span className="font-medium">{jurisdiction.name}</span>
                      <span className="text-xs text-muted-foreground ml-2 capitalize">
                        ({jurisdiction.type})
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </div>

          {/* Selected Locations */}
          {selectedJurisdictions.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-3">Selected Locations</h4>
              <div className="space-y-2">
                {selectedJurisdictions.map((jData) => {
                  return (
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
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
