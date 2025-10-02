import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { X, MapPin, ChevronDown, Plus, Navigation } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
        // For MVP, default to Austin
        // In production, you'd reverse geocode the coords
        const austinSlug = 'austin-tx';
        const travisSlug = 'travis-county-tx';
        const texasSlug = 'texas';
        
        const nearbyJurisdictions = [austinSlug, travisSlug, texasSlug].filter(slug => 
          !value.includes(slug)
        ).slice(0, maxSelections - value.length);
        
        if (nearbyJurisdictions.length > 0) {
          onChange([...value, ...nearbyJurisdictions].slice(0, maxSelections));
          toast.success("Location detected");
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
    <div className="flex items-center gap-2">
      {/* Chip-based display */}
      {selectedJurisdictions.length === 0 ? (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-10 gap-2"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Location</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[340px] p-3" align="start">
            <div className="space-y-3">
              <div className="flex flex-col gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleNearMe}
                  className="w-full justify-start gap-2"
                >
                  <Navigation className="h-4 w-4" />
                  Near Me
                </Button>
              </div>
              
              <div className="border-t pt-3">
                <Command>
                  <CommandInput placeholder="Search locations..." className="h-8" />
                  <CommandList className="max-h-[200px]">
                    <CommandEmpty>No locations found.</CommandEmpty>
                    <CommandGroup>
                      {jurisdictions.map((jurisdiction) => (
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
            </div>
          </PopoverContent>
        </Popover>
      ) : (
        <>
          {selectedJurisdictions.slice(0, 2).map((jurisdiction) => (
            <Badge 
              key={jurisdiction.id}
              variant="secondary"
              className="gap-1.5 pl-2.5 pr-1 h-10"
            >
              <MapPin className="h-3 w-3" />
              <span className="text-sm">{jurisdiction.name}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0.5 hover:bg-transparent ml-1"
                onClick={() => handleRemove(jurisdiction.slug)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
          
          {selectedJurisdictions.length > 2 && (
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Badge 
                  variant="secondary"
                  className="gap-1 cursor-pointer hover:bg-secondary/80 h-10"
                >
                  +{selectedJurisdictions.length - 2} more
                  <ChevronDown className="h-3 w-3" />
                </Badge>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-3" align="start">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm mb-2">All Locations</h4>
                  {selectedJurisdictions.map((jurisdiction) => (
                    <div
                      key={jurisdiction.id}
                      className="flex items-center justify-between py-1"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{jurisdiction.name}</span>
                        <span className="text-xs text-muted-foreground capitalize">
                          {jurisdiction.type}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => handleRemove(jurisdiction.slug)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          )}
          
          {selectedJurisdictions.length < maxSelections && (
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 w-10 p-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[340px] p-3" align="start">
                <div className="space-y-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleNearMe}
                    className="w-full justify-start gap-2"
                  >
                    <Navigation className="h-4 w-4" />
                    Near Me
                  </Button>
                  
                  <div className="border-t pt-3">
                    <Command>
                      <CommandInput placeholder="Search locations..." className="h-8" />
                      <CommandList className="max-h-[200px]">
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
                </div>
              </PopoverContent>
            </Popover>
          )}
        </>
      )}
    </div>
  );
}
