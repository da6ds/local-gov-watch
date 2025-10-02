import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { X, MapPin, ChevronDown } from "lucide-react";
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

  return (
    <div className="flex flex-col gap-2 w-full md:max-w-[420px]">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="justify-between h-10"
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <MapPin className="h-4 w-4 shrink-0" />
              {selectedJurisdictions.length === 0 ? (
                <span className="text-muted-foreground text-sm">{placeholder}</span>
              ) : (
                <span className="text-sm truncate">
                  {selectedJurisdictions.slice(0, 2).map(j => j.name).join(', ')}
                  {selectedJurisdictions.length > 2 && ` +${selectedJurisdictions.length - 2}`}
                </span>
              )}
            </div>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search locations..." />
            <CommandList>
              <CommandEmpty>No locations found.</CommandEmpty>
              <CommandGroup>
                {jurisdictions.map((jurisdiction) => (
                  <CommandItem
                    key={jurisdiction.id}
                    value={jurisdiction.slug}
                    onSelect={() => handleSelect(jurisdiction.slug)}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex flex-col">
                        <span className="font-medium">{jurisdiction.name}</span>
                        <span className="text-xs text-muted-foreground capitalize">
                          {jurisdiction.type}
                        </span>
                      </div>
                      {value.includes(jurisdiction.slug) && (
                        <Badge variant="secondary" className="ml-2">Selected</Badge>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      {selectedJurisdictions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedJurisdictions.map((jurisdiction) => (
            <Badge 
              key={jurisdiction.id}
              variant="secondary"
              className="gap-1 pr-1"
            >
              <span className="capitalize text-xs text-muted-foreground">{jurisdiction.type}:</span>
              {jurisdiction.name}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0.5 hover:bg-transparent"
                onClick={() => handleRemove(jurisdiction.slug)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
