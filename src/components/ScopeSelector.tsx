import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Building2, MapPin, Globe } from "lucide-react";

interface ScopeSelectorProps {
  value: 'city' | 'county' | 'state';
  onChange: (scope: 'city' | 'county' | 'state') => void;
}

export function ScopeSelector({ value, onChange }: ScopeSelectorProps) {
  return (
    <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-lg p-1 border border-border">
      <Button
        variant={value === 'city' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onChange('city')}
        className="gap-2"
      >
        <Building2 className="h-4 w-4" />
        City
      </Button>
      <Button
        variant={value === 'county' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onChange('county')}
        className="gap-2"
      >
        <MapPin className="h-4 w-4" />
        County
      </Button>
      <Button
        variant={value === 'state' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onChange('state')}
        className="gap-2"
      >
        <Globe className="h-4 w-4" />
        State
      </Button>
    </div>
  );
}
